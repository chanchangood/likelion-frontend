// URL 쿼리에서 roomId와 roomName 가져오기
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');
const roomName = urlParams.get('roomName');
document.getElementById('room-title').innerText = roomName;

// 채팅에 사용할 이름을 prompt로 입력 (빈 값이면 'anonymous')
const username = prompt("채팅에 사용할 이름을 입력하세요:") || 'anonymous';

// WebSocket 연결: (https, ws 자동 선택)
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${protocol}//${window.location.host}`);

// 연결 시 join 메시지 전송 (roomId와 username 포함)
socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'join', roomId, username }));
});// 여기서 입장시 메세지를 보냄. 즉 백에서는 null로 작동.

socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'chat') {
        displayMessage(data);
    }
});

document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value;
    const chatMessage = {
        type: 'chat',
        message,
        sender: username
    };
    socket.send(JSON.stringify(chatMessage));
    input.value = '';
});

function displayMessage(data) {
    const chatDiv = document.getElementById('chat-messages');
    const msgCard = document.createElement('div');
    msgCard.className = 'message';
    if (data.sender === username) {
        msgCard.classList.add('my-message');
    } else if (data.sender === 'owner') {
        msgCard.classList.add('owner-message');
    } else {
        msgCard.classList.add('other-message');
    }
    msgCard.innerText = `${data.sender}: ${data.message}`;
    chatDiv.appendChild(msgCard);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function leaveRoom() {
    socket.send(JSON.stringify({ type: 'leave', roomId }));
    window.location.href = 'index.html';
}
