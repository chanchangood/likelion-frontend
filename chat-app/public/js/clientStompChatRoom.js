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
// const socket = new SockJS('http://223.130.146.213:8083/ws');
const socket = new SockJS('http://localhost:8083/ws');
const stompClient = Stomp.over(socket); //기존 소켓을 stomp로 한번 덮어서 사용

// STOMP 연결 및 ***구독*** (메시지 수신은 '/topic/public' 또는 원하는 토픽): 구독이다. /topic/public으로 직접 메세지를 보내는 코드는 적어도 이 파일에는 없음. 전부 app을 통해 핸들러를 거쳐 메세지를 보낸다.
stompClient.connect({}, function(frame) {
    console.log('Connected: ' + frame);
    const subscription = stompClient.subscribe('/topic/public', function(message) { // /topic/public 구독!! 이건 response를 받는 걸 등록해놓는 것이다. 내가 보내진 않음
        console.log(message.body);
        const data = JSON.parse(message.body);
        // 수신된 메시지를 화면에 출력
        if (data.type && data.type.toUpperCase() === 'CHAT') {
            displayMessage(data);
        }
        if (data.type && data.type.toUpperCase() === 'JOIN') {
            displayMessage(data);
        }
    }); // 메세지 처리 로직
    console.log("subscription: " + subscription);
    // 연결 완료 후 join 메시지(옵션)를 보낼 수 있음
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({ // 클라이언트가 입장하면 app으로 서버에 유저가 들어온 것을 알려줌. 그러면 서버에서 다시 topic으로 클라이언트에게 다시 메세지를 처리해서 전송해줌
        type: 'JOIN',
        roomId: roomId,
        sender: username
    }));
});

// // 연결 시 join 메시지 전송
// socket.addEventListener('open', () => {
//     socket.send(JSON.stringify({ type: 'join', roomId, username }));
// });
//
// // 연결 시 join 메시지 전송 (roomId와 username 포함)
// socket.addEventListener('open', () => {
//     socket.send(JSON.stringify({ type: 'join', roomId, username }));
// });
//
// socket.addEventListener('message', (event) => {
//     const data = JSON.parse(event.data);
//     if (data.type === 'chat') {
//         displayMessage(data);
//     }
// });

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
    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
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
    stompClient.send(JSON.stringify({ type: 'leave', roomId }));
    window.location.href = 'index.html';
}
