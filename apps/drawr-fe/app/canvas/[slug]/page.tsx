import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { RoomCanvasComponent } from "@/components/RoomCanvasComponent";
import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function getRoom(slug: string, token: string) {
  const checkInRoom = await axios.get(`${HTTP_BACKEND}/rooms`, {
    headers: {
      Authorization: `${token}`,
    },
  });
  const exists = checkInRoom.data.some(
    ({ room }: { room: { slug: string } }) => room.slug === slug
  );
  const roomResponse = await axios.get(`${HTTP_BACKEND}/room/${slug}`, {
    headers: { Authorization: `${token}` },
  });
  const roomId = roomResponse.data.room.id;
  if (!exists) {
    await axios.post(
      `${HTTP_BACKEND}/rooms`,
      { roomId: roomId.toString() },
      {
        headers: { Authorization: `${token}` },
      }
    );
  }
  return roomId;
}
type PageProps = {
  params: { slug: string };
  searchParams: { guest?: string };
};

export default async function Canvas({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  // Fix: Access the property safely
  const isGuestMode = searchParams?.guest === "true";

  // If not guest mode and not authenticated, redirect to signin
  if (!isGuestMode && !session?.accessToken) {
    redirect("/signin");
  }

  const slug = params.slug;

  // For guest mode, prevent redirection to signin
  if (isGuestMode) {
    return <RoomCanvasComponent roomId={`guest-${slug}`} isGuestMode={true} />;
  }

  if (!session?.accessToken) {
    // This should never happen due to the earlier check, but TypeScript doesn't know that
    redirect("/signin");
  }

  const roomId = await getRoom(slug, session?.accessToken);
  return <RoomCanvasComponent token={session?.accessToken} roomId={roomId} />;
}
