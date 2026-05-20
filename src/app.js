require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./routes/api');

// Quản lý danh sách khách hàng đang chờ Chat với Staff
const activeChats = new Map(); // key: userId, value: { lastMessage, timestamp, socketId }

// Quản lý danh sách người dùng đang online (để admin xem)
const onlineUsers = new Map(); // key: socketId, value: { userId, roleId }

const emitOnlineCounts = (ioInstance) => {
  const counts = {
    staff: 0,
    customers: 0
  };

  // Sử dụng Map để lọc các User trùng lặp (1 user có thể có nhiều socket connection)
  const uniqueUsers = new Map(); // key: userId, value: roleId

  onlineUsers.forEach(user => {
    uniqueUsers.set(user.userId, user.roleId);
  });

  uniqueUsers.forEach((roleId) => {
    // role_id: 1 (Admin), 2 (Staff) -> Tính là Staff online
    if (roleId === 1 || roleId === 2) {
      counts.staff++;
    } else {
      counts.customers++;
    }
  });

  ioInstance.emit('update-online-counts', counts);
};

// Bắt lỗi sập app đột ngột
process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL ERROR (Uncaught Exception):', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 CRITICAL ERROR (Unhandled Rejection):', reason);
});

const app = express();

// ===== 1. CẤU HÌNH CORS =====
// ⚠️ QUAN TRỌNG: Khi credentials:true, KHÔNG được dùng origin:'*'
// Browser sẽ block cookie nếu origin là wildcard!
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev
  'http://localhost:5174',  // Vite dev (fallback)
  'http://localhost:3000',  // CRA dev (nếu có)
  process.env.FRONTEND_URL, // URL production (set trong .env)
  /\.ngrok-free\.app$/,     // ngrok tunnel (test webhook)
  /\.ngrok-free\.dev$/,     // ngrok tunnel (test webhook)
].filter(Boolean); // Bỏ các giá trị undefined

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (Postman, curl, mobile app, PayOS webhook)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed =>
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
    );
    if (isAllowed) return callback(null, true);
    return callback(new Error(`CORS blocked: origin ${origin} không được phép`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // ✅ Cho phép gửi/nhận cookie
}));

// ===== 2. MIDDLEWARE CƠ BẢN =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Thêm một route kiểm tra (Health Check) để biết Server đã online hay chưa
app.get('/', (req, res) => {
  res.status(200).json({ message: "API Cellphones đang hoạt động mượt mà! 🚀" });
});

// ===== 3. ĐƯỜNG DẪN API =====
app.use('/api', apiRoutes);

// ===== 4. XỬ LÝ LỖI (ERROR HANDLING) =====
// Middleware này giúp bắt các lỗi server để không làm sập app khi deploy
app.use((err, req, res, next) => {
  console.error("Lỗi Server:", err.stack);
  res.status(500).json({ message: "Có lỗi xảy ra từ phía Server!" });
});

// ===== 5. KHỞI CHẠY SERVER =====
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Gắn io vào app để dùng ở controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Một khách hàng đã kết nối Socket:', socket.id);

  // 1. NHẬN DIỆN NGƯỜI DÙNG (Để đếm số lượng online)
  socket.on('identify', (userData) => {
    if (userData && userData.userId) {
      onlineUsers.set(socket.id, {
        userId: userData.userId,
        roleId: Number(userData.roleId || 3) // Mặc định là khách hàng nếu không có role
      });
      console.log(`🆔 Socket ${socket.id} đã định danh: User ${userData.userId}, Role ${userData.roleId}`);
      emitOnlineCounts(io);
    }
  });
  
  socket.on('join-order-room', (orderCode) => {
    try {
      if (!orderCode) return;
      socket.join(`order_${orderCode}`);
      console.log(`📦 Socket ${socket.id} đã tham gia phòng đơn hàng: order_${orderCode}`);
    } catch (err) {
      console.error('❌ Lỗi Socket Join:', err);
    }
  });

  // 2. CHAT REAL-TIME (Cải tiến: Hỗ trợ cả AI và Staff)
    
  // Khách hàng tham gia phòng chat riêng (dùng ID hoặc Session)
  socket.on('join-chat', (userId) => {
    socket.join(`room_user_${userId}`);
    console.log(`👤 Khách hàng ${userId} đã mở khung Chat (Socket: ${socket.id})`);
  });

  // Staff tham gia phòng chat của khách hàng để hỗ trợ
  socket.on('staff-join-room', (userId) => {
    socket.join(`room_user_${userId}`);
    console.log(`👨‍💼 Nhân viên đã tham gia hỗ trợ khách hàng: ${userId}`);
    
    // Gửi lại lịch sử tin nhắn cho Staff nếu có
    if (activeChats.has(userId)) {
        socket.emit('load-history', activeChats.get(userId).history || []);
    }
  });

  // Lắng nghe tin nhắn từ khách hàng gửi cho Staff/AI
  socket.on('send_message', async (data) => {
    const { userId, message, type, productContext, userName, userPhone } = data;
    
    console.log(`💬 Tin nhắn từ Khách hàng ${userId || socket.id}:`, message);
    if (productContext) console.log(`📦 [CONTEXT] SP đang hỏi: ${productContext.name} (ID: ${productContext.id})`);

    if (type === 'staff') {
      const existing = activeChats.get(userId) || { history: [] };
      const newMessage = {
          text: message,
          sender: 'user',
          timestamp: new Date()
      };

      activeChats.set(userId, {
          userId,
          lastMessage: message,
          timestamp: new Date(),
          socketId: socket.id,
          productContext: productContext || existing.productContext || null,
          userName: userName || existing.userName || `Khách #${userId}`,
          userPhone: userPhone || existing.userPhone || null,
          history: [...(existing.history || []), newMessage]
      });

      // Gửi tin nhắn này vào phòng của User để Staff (nếu đã join) nhận được
      socket.to(`room_user_${userId}`).emit('receive_message', newMessage);

      // Thông báo cho toàn bộ staff đang online cập nhật danh sách
      io.emit('active-chats-changed', Array.from(activeChats.values()));
      // Thông báo cho staff biết có tin nhắn mới (cho toast/notification)
      io.emit('new-customer-message', { userId, message }); 
    } else {
      // Logic AI cũ
      const chatController = require('./controllers/chatController');
      const mockReq = { body: { message: message } };
      const mockRes = {
        json: (result) => {
          socket.emit('receive_message', {
            text: result.reply || result.error || "Dạ, em đang suy nghĩ...",
            sender: 'bot',
            timestamp: new Date()
          });
        },
        status: () => ({ json: (err) => socket.emit('receive_message', { text: err.message, sender: 'bot' }) })
      };
      try {
        await chatController.handleChat(mockReq, mockRes);
      } catch (err) {
        socket.emit('receive_message', { text: "Lỗi kết nối AI", sender: 'bot' });
      }
    }
  });

  // Staff yêu cầu lấy danh sách chat đang chờ
  socket.on('get-active-chats', () => {
      socket.emit('active-chats-changed', Array.from(activeChats.values()));
  });

  // Staff phản hồi tin nhắn
  socket.on('staff-send-message', (data) => {
      const { userId, message } = data;
      const newMessage = {
          text: message,
          sender: 'staff',
          timestamp: new Date()
      };
      
      // Cập nhật tin nhắn cuối cùng và lịch sử trong danh sách
      if (activeChats.has(userId)) {
          const chat = activeChats.get(userId);
          chat.lastMessage = `Bạn: ${message}`;
          chat.timestamp = new Date();
          chat.history = [...(chat.history || []), newMessage];
      }

      socket.to(`room_user_${userId}`).emit('receive_message', newMessage);

      // Cập nhật lại list cho tất cả staff
      io.emit('active-chats-changed', Array.from(activeChats.values()));
  });

  // Hiệu ứng đang gõ
  socket.on('typing', (data) => {
      const { userId, isTyping, role } = data;
      socket.to(`room_user_${userId}`).emit('display-typing', { isTyping, role });
  });

  // Đã xem tin nhắn
  socket.on('mark-as-read', (userId) => {
      socket.to(`room_user_${userId}`).emit('messages-read');
  });

  // Xóa khỏi danh sách chờ (Kỹ thuật viên kết thúc hỗ trợ)
  socket.on('staff-close-chat', (userId) => {
      activeChats.delete(userId);
      io.emit('active-chats-changed', Array.from(activeChats.values()));
      console.log(`✅ Hỗ trợ khách hàng ${userId} hoàn tất.`);
  });

  socket.on('error', (err) => {
    console.error('🔌 Socket Error:', err);
  });

  socket.on('disconnect', () => {
    console.log('❌ Một Socket đã ngắt kết nối:', socket.id);
    if (onlineUsers.has(socket.id)) {
      onlineUsers.delete(socket.id);
      emitOnlineCounts(io);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  --------------------------------------------------
  🚀 Server (kèm Socket.io) đang chạy thành công!
  📡 Port: ${PORT}
  🔗 URL: http://0.0.0.0:${PORT}
  --------------------------------------------------
  `);
});