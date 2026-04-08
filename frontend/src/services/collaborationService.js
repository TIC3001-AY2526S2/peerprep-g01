import { io } from "socket.io-client";

    const SOCKET_URL = "http://localhost:3003";

    export const socket = io(SOCKET_URL, {
      path: "/socket.io",
      autoConnect: false,
    });