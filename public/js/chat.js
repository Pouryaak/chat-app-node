const socket = io();

// Elements
const $form = document.querySelector("form");
const $messageFormInput = $form.querySelector("input");
const $messageButton = $form.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMEssageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMEssageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;
  // Height of messages container
  const containerHeight = $messages.scrollHeight;
  // How far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

$form.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageButton.setAttribute("disabled", "disabled");
  socket.emit("message", e.target.elements.message.value, (error) => {
    $messageButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return alert(error);
    }
    console.log("Message delivered!");
  });
});

socket.on("locationMessage", (location) => {
  const html = Mustache.render(locationTemplate, {
    username:
      location.username.charAt(0).toUpperCase() + location.username.slice(1),
    location: location.url,
    createdAt: moment(location.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  $sidebar.innerHTML = html;
});

socket.on("newMessage", (message) => {
  const html = Mustache.render(messageTemplate, {
    username:
      message.username.charAt(0).toUpperCase() + message.username.slice(1),
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }
  $locationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        long: position.coords.longitude,
        lat: position.coords.latitude,
      },
      () => {
        $locationButton.removeAttribute("disabled");
        console.log("Location shared!");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
