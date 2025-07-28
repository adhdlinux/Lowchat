var client = io();
var room = window.location.pathname === '/' ? '/main' : window.location.pathname;
var key = false;

var chathistory = [];
var index = 0;

var chatlog = {};
var lasttime = false;

var version = '2.0';
var unread = 0;
var focus = true;
var currentUsername = 'Guest';
var filesToUpload = [];
var mediaRecorder = null;
var recordingChunks = [];
var recordingStartTime = null;
var recordingInterval = null;

$(document).ready(function () {
	$('.discord-input').focus();

	// Update channel name in header and current channel
	updateChannelDisplay();

	client.emit('join', room);
	room = room.substr(1);
	
	if (localStorage.getItem('chatlog') && localStorage.getItem('version') === version) {
		chatlog = JSON.parse(localStorage.getItem('chatlog'));
		parseChatLog();
	} else {
		localStorage.setItem('version', version);
	}
	
	client.on('bounce', function (data) {
		switch (data.type) {
			case 'join':
				if (localStorage.getItem('username')) {
					currentUsername = localStorage.getItem('username');
					updateUserDisplay();
					client.emit('message', {
						message: `/nick ${localStorage.getItem('username')}`
					});
				}
				document.title = `Discord - ${room}`;
				break;
		}
	});
	
	client.on('message', function (data) {
		data.time = formatDate(new Date());
		data.date = new Date();
		appendLog(data);
		
		// Notification logic: If window is not in focus, increment unread and play sound
		if (!focus) {
			unread++;
			document.title = `(${unread}) Discord - ${room}`;
			$('#icon').prop('href', 'images/fav-unread.png');

			// Play notification sound
			try {
				document.getElementById('notificationSound').play();
			} catch(e) {
				console.log('Could not play notification sound');
			}
		}
	});

	$('.discord-input').on('keydown', function (e) {
		let message = $(this).text();
		if (e.keyCode === 13 && !e.shiftKey) {
			e.preventDefault();
			$(this).text('');
			if (message.indexOf('/join') === 0) {
				let newRoom = message.split(' ')[1];
				if (newRoom) {
					window.location.pathname = '/' + newRoom;
				}
			} else if (message.indexOf('/clearlog') === 0) {
				chatlog[room] = [];
				localStorage.setItem('chatlog', JSON.stringify(chatlog));
				location.reload();
			} else if (message.indexOf('/clearname') === 0) {
				localStorage.removeItem('username');
				currentUsername = 'Guest';
				updateUserDisplay();
			} else {
				if (message.indexOf('/nick') === 0) {
					let newName = message.split(' ')[1];
					if (newName) {
						localStorage.setItem('username', newName);
						currentUsername = newName;
						updateUserDisplay();
					}
				}
				client.emit('message', {
					message
				});
				chathistory.unshift(message);
				index = 0;
			}
		} else if (e.keyCode === 38) {
			e.preventDefault();
			if (chathistory.length > 0) {
				$(this).text(chathistory[index]);
				index = (index + 1) % chathistory.length;
			}
		} else if (e.keyCode === 40) {
			e.preventDefault();
			if (chathistory.length > 0) {
				$(this).text(chathistory[index]);
				index = index - 1 < 0 ? 0 : index - 1;
			}
		}
	});

	// Handle input placeholder update
	updateInputPlaceholder();

	// File upload button click
	$('#fileUploadBtn').click(function() {
		$('#hiddenFileInput').click();
	});

	// Hidden file input change
	$('#hiddenFileInput').change(function(e) {
		handleFileSelection(e.target.files);
		$(this).val(''); // Reset input
	});

	// Drag and drop handlers
	$(document).on('dragover', function(e) {
		e.preventDefault();
		e.stopPropagation();
		$('#dragOverlay').show();
	});

	$(document).on('dragleave', function(e) {
		if (e.target === document) {
			$('#dragOverlay').hide();
		}
	});

	$(document).on('drop', function(e) {
		e.preventDefault();
		e.stopPropagation();
		$('#dragOverlay').hide();

		const files = e.originalEvent.dataTransfer.files;
		if (files.length > 0) {
			handleFileSelection(files);
		}
	});

	// File preview actions
	$('#sendFiles').click(function() {
		uploadAndSendFiles();
	});

	$('#cancelFiles').click(function() {
		clearFilePreview();
	});

	$('#filePreviewClose').click(function() {
		clearFilePreview();
	});

	// Voice recording
	$('#voiceRecordBtn').click(function() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			stopRecording();
		} else {
			startRecording();
		}
	});

	$('#stopRecording').click(function() {
		stopRecording();
	});

	$('#cancelRecording').click(function() {
		cancelRecording();
	});
});

function updateChannelDisplay() {
	let channelName = room === 'main' ? 'general' : room.replace(/[^a-zA-Z0-9]/g, '');
	$('#header-channel-name').text(channelName);
	$('#current-channel .discord-channel-name').text(channelName);
	updateInputPlaceholder();
}

function updateInputPlaceholder() {
	let channelName = room === 'main' ? 'general' : room.replace(/[^a-zA-Z0-9]/g, '');
	$('.discord-input').attr('data-placeholder', `Message #${channelName}`);
}

function updateUserDisplay() {
	$('#current-username').text(currentUsername);
	$('#user-avatar').text(getInitials(currentUsername));
}

function getInitials(name) {
	if (!name || name === 'Guest') return '?';
	if (name.startsWith('@')) name = name.substr(1);
	
	let words = name.split(' ');
	if (words.length >= 2) {
		return (words[0][0] + words[1][0]).toUpperCase();
	}
	return name.substr(0, 2).toUpperCase();
}

function getAvatarColor(name) {
	if (!name) return '#5865f2';
	
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	
	const colors = [
		'#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245',
		'#f47fff', '#00d4aa', '#ff8a4b', '#1abc9c', '#3498db',
		'#9b59b6', '#e67e22', '#e74c3c', '#f1c40f', '#2ecc71'
	];
	
	return colors[Math.abs(hash) % colors.length];
}

function generateMediaHTML(fileInfo) {
	const isImage = fileInfo.mimetype.startsWith('image/');
	const isAudio = fileInfo.mimetype.startsWith('audio/');
	const isVideo = fileInfo.mimetype.startsWith('video/');

	if (isImage) {
		return `
			<div class="discord-media-message">
				<img src="${fileInfo.url}" alt="${fileInfo.originalName}" class="discord-image-attachment" onclick="window.open('${fileInfo.url}', '_blank')">
			</div>
		`;
	} else if (isAudio) {
		return `
			<div class="discord-media-message">
				<div class="discord-audio-attachment">
					<div class="discord-audio-info">
						<div class="discord-audio-icon">
							<svg width="16" height="16" viewBox="0 0 24 24">
								<path fill="currentColor" d="M12,3V12.26C11.5,12.09 11,12 10.5,12C8.01,12 6,14.01 6,16.5C6,18.99 8.01,21 10.5,21C12.99,21 15,18.99 15,16.5V7H19V3H12Z"/>
							</svg>
						</div>
						<div class="discord-audio-details">
							<div class="discord-audio-name">${fileInfo.originalName}</div>
							<div class="discord-audio-size">${formatFileSize(fileInfo.size)}</div>
						</div>
					</div>
					<audio controls class="discord-audio-controls">
						<source src="${fileInfo.url}" type="${fileInfo.mimetype}">
						Your browser does not support the audio element.
					</audio>
				</div>
			</div>
		`;
	} else if (isVideo) {
		return `
			<div class="discord-media-message">
				<video controls class="discord-video-attachment">
					<source src="${fileInfo.url}" type="${fileInfo.mimetype}">
					Your browser does not support the video element.
				</video>
			</div>
		`;
	} else {
		// Generic file
		const extension = fileInfo.originalName.split('.').pop().toUpperCase();
		return `
			<div class="discord-media-message">
				<div class="discord-file-attachment">
					<div class="discord-file-icon">${extension}</div>
					<div class="discord-file-info">
						<div class="discord-file-name">${fileInfo.originalName}</div>
						<div class="discord-file-size">${formatFileSize(fileInfo.size)}</div>
					</div>
					<button class="discord-file-download" onclick="window.open('${fileInfo.url}', '_blank')">
						<svg width="16" height="16" viewBox="0 0 24 24">
							<path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
						</svg>
					</button>
				</div>
			</div>
		`;
	}
}

function parseChatLog() {
	if (chatlog && chatlog[room]) {
		for (let i in chatlog[room]) {
			appendLog(chatlog[room][i], true);
		}
		appendLog({
			name: 'server',
			message: '━━━━━━ Previously cached messages ━━━━━━',
			color: 'server',
			time: formatDate(new Date()),
			date: new Date()
		}, true);
	}
}

function appendLog(data, avoid) {
	let logdiv = document.getElementById('log');
	let template = $('#itemTemplate').html();
	let message = data.message;
	
	// Convert URLs to links
	message = message.replace(/http(s)*:\/\/[^\s]*/g, '<a href="$&" target="_blank">$&</a>');
	
	// Convert mentions to styled mentions
	message = message.replace(/@(\w+)/g, '<span class="discord-mention">@$1</span>');
	
	// Convert inline code
	message = message.replace(/`([^`]+)`/g, '<span class="discord-inline-code">$1</span>');
	
	let color = data.color || data.name;
	let time = data.time;
	let name = data.name;
	let initials = getInitials(name);
	let isServer = false;
	let isPM = false;

	if (data.name === 'server') {
		template = template.replace('{{type}}', 'server');
		name = '';
		initials = '';
		isServer = true;
		avoid = true;
	} else if (data.type && data.type === 'direct') {
		template = template.replace('{{type}}', 'pm');
		isPM = true;
		avoid = true;
	} else {
		template = template.replace('{{type}}', 'normal');
	}

	// Handle date separators
	data.date = data.date ? new Date(data.date) : new Date();
	lasttime = lasttime ? new Date(lasttime) : new Date();
	
	if (data.date && lasttime && days(data.date) > days(lasttime)) {
		appendLog({
			name: 'server',
			message: `━━━━━━ ${data.date.toDateString()} ━━━━━━`,
			color: 'server',
			time: formatDate(data.date),
			date: false
		}, true);
	}
	lasttime = data.date;

	// Replace template variables
	template = template.replace(/\{\{name\}\}/g, name);
	template = template.replace(/\{\{message\}\}/g, message);
	template = template.replace(/\{\{color\}\}/g, color);
	template = template.replace(/\{\{time\}\}/g, time);
	template = template.replace(/\{\{initials\}\}/g, initials);
	template = template.replace(/\{\{id\}\}/g, Date.now() + Math.random());

	let $newMessage = $(template);
	$newMessage.addClass('new-message');
	
	$('.discord-messages').append($newMessage);

	// Apply username colors
	$newMessage.find('.discord-message-username').each(function () {
		let username = $(this).text();
		if (username.includes('@')) {
			$(this).css('color', '#f04747'); // Admin color
		} else {
			$(this).css('color', getAvatarColor(color));
		}
	});

	// Apply avatar colors
	$newMessage.find('.discord-message-avatar').each(function () {
		if (!isServer) {
			$(this).css('background', `linear-gradient(45deg, ${getAvatarColor(color)}, ${getAvatarColor(color + '2')})`);
		}
	});

	// Scroll to bottom
	logdiv.scrollTop = logdiv.scrollHeight;

	// Save to chat log
	if (!avoid) {
		if (!chatlog[room]) {
			chatlog[room] = [];
		}
		chatlog[room].push(data);
		localStorage.setItem('chatlog', JSON.stringify(chatlog));
	}

	// Remove animation class after animation completes
	setTimeout(() => {
		$newMessage.removeClass('new-message');
	}, 300);
}

function formatDate(date) {
	let now = new Date();
	let isToday = date.toDateString() === now.toDateString();
	
	if (isToday) {
		return formatTime(date);
	} else {
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric' 
		}) + ' at ' + formatTime(date);
	}
}

function formatTime(date) {
	let hours = date.getHours();
	let minutes = date.getMinutes();
	let ampm = hours >= 12 ? 'PM' : 'AM';
	
	hours = hours % 12;
	hours = hours ? hours : 12; // 0 should be 12
	
	let minutesStr = minutes < 10 ? '0' + minutes : minutes;
	
	return `${hours}:${minutesStr} ${ampm}`;
}

function days(date) {
	return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
}

// Window focus/blur handlers
$(window).focus(function () {
	focus = true;
	unread = 0;
	document.title = `Discord - ${room}`;
	$('#icon').prop('href', 'images/fav.png');
}).blur(function () {
	focus = false;
});

// File handling functions
function handleFileSelection(files) {
	filesToUpload = Array.from(files);
	displayFilePreview();
}

function displayFilePreview() {
	if (filesToUpload.length === 0) {
		$('#filePreview').hide();
		return;
	}

	const previewList = $('#filePreviewList');
	previewList.empty();

	filesToUpload.forEach((file, index) => {
		const fileItem = $(`
			<div class="discord-file-preview-item">
				<div class="discord-file-preview-thumbnail" id="thumb-${index}">
					${getFileIcon(file.type)}
				</div>
				<div class="discord-file-preview-info">
					<div class="discord-file-preview-name">${file.name}</div>
					<div class="discord-file-preview-size">${formatFileSize(file.size)}</div>
				</div>
				<button class="discord-file-preview-remove" onclick="removeFile(${index})">×</button>
			</div>
		`);

		previewList.append(fileItem);

		// Generate image thumbnail
		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = function(e) {
				$(`#thumb-${index}`).html(`<img src="${e.target.result}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">`);
			};
			reader.readAsDataURL(file);
		}
	});

	$('#filePreview').show();
}

function removeFile(index) {
	filesToUpload.splice(index, 1);
	displayFilePreview();
}

function clearFilePreview() {
	filesToUpload = [];
	$('#filePreview').hide();
}

function getFileIcon(mimeType) {
	if (mimeType.startsWith('image/')) {
		return '<svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M5,4H19A2,2 0 0,1 21,6V18A2,2 0 0,1 19,20H5A2,2 0 0,1 3,18V6A2,2 0 0,1 5,4M5,16L8.5,12.5L11,15.5L14.5,11L19,16H5Z"/></svg>';
	} else if (mimeType.startsWith('audio/')) {
		return '<svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12,3V12.26C11.5,12.09 11,12 10.5,12C8.01,12 6,14.01 6,16.5C6,18.99 8.01,21 10.5,21C12.99,21 15,18.99 15,16.5V7H19V3H12Z"/></svg>';
	} else if (mimeType.startsWith('video/')) {
		return '<svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>';
	} else {
		return '<svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>';
	}
}

function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadAndSendFiles() {
	const uploadPromises = filesToUpload.map(file => uploadFile(file));

	try {
		const uploadedFiles = await Promise.all(uploadPromises);

		// Send file message for each uploaded file
		uploadedFiles.forEach(fileInfo => {
			const message = {
				type: 'file',
				fileInfo: fileInfo,
				message: `📎 ${fileInfo.originalName}`
			};

			client.emit('message', message);
		});

		clearFilePreview();
	} catch (error) {
		console.error('Error uploading files:', error);
		alert('Error uploading files. Please try again.');
	}
}

async function uploadFile(file) {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch('/upload', {
		method: 'POST',
		body: formData
	});

	if (!response.ok) {
		throw new Error('Upload failed');
	}

	return await response.json();
}

// Voice recording functions
async function startRecording() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(stream);
		recordingChunks = [];

		mediaRecorder.ondataavailable = function(event) {
			recordingChunks.push(event.data);
		};

		mediaRecorder.onstop = function() {
			const blob = new Blob(recordingChunks, { type: 'audio/webm' });
			uploadVoiceMessage(blob);
			stream.getTracks().forEach(track => track.stop());
		};

		mediaRecorder.start();
		recordingStartTime = Date.now();

		$('#voiceRecordBtn').addClass('recording');
		$('#voiceRecording').show();

		// Update recording time
		recordingInterval = setInterval(updateRecordingTime, 100);

	} catch (error) {
		console.error('Error starting recording:', error);
		alert('Could not access microphone. Please check permissions.');
	}
}

function stopRecording() {
	if (mediaRecorder && mediaRecorder.state === 'recording') {
		mediaRecorder.stop();
		cleanupRecording();
	}
}

function cancelRecording() {
	if (mediaRecorder && mediaRecorder.state === 'recording') {
		mediaRecorder.stop();
	}
	cleanupRecording();
	recordingChunks = [];
}

function cleanupRecording() {
	$('#voiceRecordBtn').removeClass('recording');
	$('#voiceRecording').hide();
	clearInterval(recordingInterval);
	recordingStartTime = null;
}

function updateRecordingTime() {
	if (recordingStartTime) {
		const elapsed = (Date.now() - recordingStartTime) / 1000;
		const minutes = Math.floor(elapsed / 60);
		const seconds = Math.floor(elapsed % 60);
		$('#recordingTime').text(`${minutes}:${seconds.toString().padStart(2, '0')}`);
	}
}

async function uploadVoiceMessage(blob) {
	const formData = new FormData();
	const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
	formData.append('file', file);

	try {
		const response = await fetch('/upload', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const fileInfo = await response.json();
			const message = {
				type: 'file',
				fileInfo: fileInfo,
				message: `🎤 Voice message`
			};

			client.emit('message', message);
		}
	} catch (error) {
		console.error('Error uploading voice message:', error);
	}
}

// Initialize user display
updateUserDisplay();
