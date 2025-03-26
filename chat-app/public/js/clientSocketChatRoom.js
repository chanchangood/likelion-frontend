// URL 쿼리에서 roomId와 roomName 가져오기
const urlParams = new URLSearchParams(window.location.search);

const roomId = urlParams.get('roomId');
const roomName = urlParams.get('roomName');
document.getElementById('room-title').innerText = roomName;

// 채팅에 사용할 이름을 prompt로 입력 (빈 값이면 'anonymous')
let username = localStorage.getItem("username");
if (!username) {
    username = prompt("채팅에 사용할 이름을 입력하세요:") || 'anonymous';
    localStorage.setItem("username", username);
}


// WebSocket 연결: (https, ws 자동 선택)
const socket = new WebSocket(`ws://localhost:8083/ws`); //stomp방식으로 진화하기전 방식

// 연결 시 join 메시지 전송
socket.addEventListener('open', () => {
    const chatMessage = {
        type: 'JOIN',
        roomId: roomId,
        sender: username
    };
    socket.send(JSON.stringify(chatMessage));
});

socket.addEventListener('message', (event) => {
    console.log(event.data)
    const data = JSON.parse(event.data);
    if (data.type && data.type.toUpperCase() === 'CHAT') {
        displayMessage(data);
    }
    if (data.type && data.type.toUpperCase() === 'JOIN') {
        displayMessage(data);
    }
});

document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value;
    const chatMessage = {
        type: 'CHAT',
        roomId: roomId,
        sender: username,
        content: message
    };
    socket.send(JSON.stringify(chatMessage));
    input.value = '';
});


function displayMessage(data) {
    console.log("displayMessage 호출됨", data);
    const chatDiv = document.getElementById('chat-messages');
    if (!chatDiv) {
        console.error("chat-messages 요소를 찾을 수 없습니다.");
        return;
    }
    const msgCard = document.createElement('div');
    msgCard.className = 'message';
    // 스타일 구분 (보낸 사람이 현재 사용자와 동일한지 등)
    if (data.sender === username) {
        msgCard.classList.add('my-message');
    } else if (data.sender === 'owner') {
        msgCard.classList.add('owner-message');
    } else {
        msgCard.classList.add('other-message');
    }
    msgCard.innerText = `${data.sender}: ${data.content}`;
    chatDiv.appendChild(msgCard);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function leaveRoom() {
    socket.send(JSON.stringify({ type: 'leave', roomId }));
    window.location.href = 'index.html';
}
