# LowChat v2 - Discord-Style Chat Application

A powerful, real-time chatting application featuring a beautiful Discord-inspired interface with comprehensive file sharing, voice messaging, and multimedia support. Built with Node.js, Express, Socket.IO, and modern web technologies.

## ✨ Features

### 🎨 **Discord-Style Interface**
- **Authentic Discord Design**: Pixel-perfect recreation of Discord's interface
- **Server & Channel List**: Organized sidebar with server and channel navigation
- **User Panel**: Real-time user status and avatar display
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 💬 **Real-Time Messaging**
- **Instant Messages**: Real-time message delivery with Socket.IO
- **Message History**: Persistent chat history with local storage
- **Typing Indicators**: Live typing status (when implemented)
- **Message Formatting**: Support for mentions, links, and inline code

### 📁 **Comprehensive File Sharing**
- **Drag & Drop Upload**: Simply drag files into the chat area
- **Multiple File Types**: Support for images, videos, audio, documents, and more
- **Smart Media Display**: 
  - Images display inline with click-to-enlarge
  - Videos show with built-in player controls
  - Audio files include custom audio players
  - Documents show with download links
- **File Size Limits**: 50MB maximum file size
- **Automatic Thumbnails**: Generated for image files
- **Universal Support**: Any file type can be uploaded and shared

### 🎤 **Voice Messaging**
- **One-Click Recording**: Record voice messages with microphone button
- **Real-Time Timer**: See recording duration as you speak
- **High-Quality Audio**: WebM format for optimal quality
- **Instant Playback**: Voice messages play directly in chat

### 🏠 **Room System**
- **Multiple Rooms**: Create and join different chat rooms
- **Room Navigation**: Easy switching between rooms via URL or commands
- **Room Privacy**: Each room maintains separate message history
- **Room Statistics**: View active users and room information

### 👤 **User Management**
- **Nicknames**: Set and save custom usernames
- **User Avatars**: Colorful gradient avatars with initials
- **Admin System**: Operator privileges for room management
- **User Status**: Online indicators and user information

### 🔊 **Audio Notifications**
- **Message Alerts**: Sound notifications for new messages
- **Focus Detection**: Notifications only when window is not active
- **Unread Counter**: Title bar shows unread message count
- **Custom Sounds**: GOTMAIL.WAV notification sound

### 🛡️ **Security Features**
- **XSS Protection**: HTML escaping for user messages
- **File Validation**: Server-side file type and size validation
- **Secure Upload**: UUID-based file naming prevents conflicts
- **Rate Limiting**: Built-in protection against spam

## 🚀 **Getting Started**

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd lowchat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
ADMIN=your_admin_key_here
```

## 📱 **How to Use**

### Basic Chat
1. **Join a Room**: Navigate to `http://localhost:3000/roomname` or use `/join roomname`
2. **Set Nickname**: Use `/nick YourName` to set your display name
3. **Send Messages**: Type in the input field and press Enter

### File Sharing
1. **Upload Files**: 
   - Drag files directly into the chat area, or
   - Click the attachment button (📎) next to the message input
2. **Preview Files**: Review files before sending in the preview panel
3. **Send Files**: Click "Send" to share with the room

### Voice Messages
1. **Start Recording**: Click the microphone button (🎤)
2. **Record**: Speak your message (timer shows duration)
3. **Send**: Click "Stop & Send" to share your voice message

## 💻 **Commands**

### Client Commands
- **`/clearlog`** - Clears the chatlog cache for the current room
- **`/clearname`** - Clears the username cache
- **`/help`** - Shows the available commands
- **`/join <room>`** - Joins the specified room
- **`/msg <user> <message>`** - Sends a direct/private message to the specified user
- **`/nick <name>`** - Changes and saves your nickname
- **`/rooms`** - Lists the active rooms on the server
- **`/users`** - Lists the users in current room
- **`/whois <user>/#<room>`** - Shows stats of the specified user or room

### Operator Commands
- **`/kick <user>`** - Kicks the specified user
- **`/op <user>`** - Enables admin privileges for the specified user
- **`/deop <user>`** - Disables admin privileges for the specified user
- **`/mute <user>`** - Mutes the specified user
- **`/unmute <user>`** - Unmutes the specified user
- **`/key <admin_key>`** - Gain admin privileges with the admin key

## 🛠️ **Technical Details**

### Backend Technologies
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Multer** - File upload handling
- **Sharp** - Image processing and thumbnail generation
- **UUID** - Unique file naming

### Frontend Technologies
- **Vanilla JavaScript** - Client-side functionality
- **jQuery** - DOM manipulation
- **CSS3** - Discord-style interface styling
- **HTML5** - Media players and file handling
- **Web APIs** - MediaRecorder for voice messages

### File Storage
- **Local Storage**: Files stored in `public/uploads/` directory
- **Thumbnails**: Auto-generated for images in `public/uploads/`
- **Static Serving**: Files served directly via Express static middleware

## 🎨 **Customization**

### Styling
The Discord-style interface can be customized by modifying `public/style.css`. The CSS uses Discord's actual color scheme and styling patterns.

### File Upload Limits
Modify the file size limit in `app.js`:
```javascript
limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
}
```

### Notification Sounds
Replace `public/GOTMAIL.WAV` with your preferred notification sound.

## 📦 **File Support**

### Supported Media Types
- **Images**: JPG, JPEG, PNG, GIF, WebP, BMP, SVG, ICO, TIFF, AVIF
- **Videos**: MP4, WebM, OGG (browser-supported formats display inline)
- **Audio**: MP3, WAV, OGG, AAC, M4A, Opus
- **Documents**: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX
- **Archives**: ZIP, RAR, 7Z, TAR
- **Code**: JS, HTML, CSS, JSON, Python, Java, C++

### Fallback Handling
- Unsupported media formats show download links
- All file types are accepted and can be shared
- Smart file type detection with appropriate icons

## 🐛 **Troubleshooting**

### Common Issues
1. **Server Won't Start**: Check if port 3000 is available
2. **Files Won't Upload**: Ensure `public/uploads/` directory exists
3. **Voice Recording Fails**: Check microphone permissions in browser
4. **Images Don't Display**: Verify file uploaded successfully to uploads folder

### Browser Compatibility
- **Chrome**: Full support for all features
- **Firefox**: Full support for all features  
- **Safari**: Limited voice recording support
- **Edge**: Full support for all features

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🎯 **Roadmap**

- [ ] Private messaging system
- [ ] User authentication and accounts
- [ ] Message encryption
- [ ] Emoji reactions
- [ ] Typing indicators
- [ ] Push notifications
- [ ] Mobile app versions
- [ ] Advanced admin dashboard

---

**LowChat v2** - Experience Discord-quality chat with powerful file sharing and voice messaging capabilities.
