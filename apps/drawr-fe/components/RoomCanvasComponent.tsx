"use client";

import { WS_BACKEND } from "@/config";
import { useEffect, useState } from "react";
import { CanvasComponent } from "./CanvasComponent";
import { UserAvatar } from "./AvatarComponent";
import { WSLoader } from "./WSLoader";
import { getOrCreateGuestUser, GuestUser } from "@/utils/guestUser";

export function RoomCanvasComponent({
  roomId,
  token,
  isGuestMode = false,
}: {
  roomId: string;
  token?: string;
  isGuestMode?: boolean;
}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const wsUrl = `${WS_BACKEND}?token=${token}`;
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);

  useEffect(() => {
    if (isGuestMode) {
      // For guest mode, we don't need a real WebSocket connection
      const user = getOrCreateGuestUser();
      setGuestUser(user);
      setRoomUsers([user.username]);
      return;
    }

    if (!token) return;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId: Number(roomId),
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "room_users") {
        const uniqueUsers = [
          ...new Set((data.users as string[]).filter(Boolean)),
        ];
        setRoomUsers(uniqueUsers);
      }
    };

    // Listen for beforeunload event
    const handleBeforeUnload = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "leave_room",
            roomId: Number(roomId),
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      ws.close();
    };
  }, [roomId, wsUrl, isGuestMode]);

  if (!socket && !isGuestMode) {
    return <WSLoader />;
  }

  return (
    <div className="relative">
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-10">
        {roomUsers.map((username, index) => (
          <div key={`${username}-${index}`} className="group relative">
            <UserAvatar name={username} size="sm" />
          </div>
        ))}
      </div>
      <CanvasComponent
        roomId={roomId}
        socket={socket}
        isGuestMode={isGuestMode}
        guestUser={isGuestMode ? guestUser : null}
      />
    </div>
  );
}
