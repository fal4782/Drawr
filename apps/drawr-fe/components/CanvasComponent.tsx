import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import {
  CircleIcon,
  EraserIcon,
  PencilIcon,
  BaselineIcon,
  RectangleHorizontalIcon,
  SlashIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MoveIcon,
} from "lucide-react";
import { Game } from "@/draw/game";
import { usePageSize } from "@/hooks/usePagesize";

type Tool =
  | "circle"
  | "rectangle"
  | "line"
  | "eraser"
  | "pencil"
  | "text"
  | "pan";

export function CanvasComponent({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const pageSize = usePageSize();
  const [selectedColor, setSelectedColor] = useState<string>("white");

  useEffect(() => {
    game?.setStrokeColor(selectedColor);
  }, [selectedColor, game]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.drawImage(canvas, 0, 0);

    const newWidth = pageSize.width;
    const newHeight = pageSize.height;

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.drawImage(tempCanvas, 0, 0);

    game?.clearCanvas();
  }, [pageSize]);

  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
  const [textInput, setTextInput] = useState({
    isVisible: false,
    x: 0,
    y: 0,
  });

  const toolDescriptions: Record<Tool, string> = {
    pencil: "Click and drag, release when you're finished",
    line: "Click and drag",
    rectangle: "Click and drag to set size",
    circle: "Click and drag to set size",
    text: "Click anywhere to add text",
    eraser: "Click to erase",
    pan: "Click and drag to move around",
    // zoomin: "Click to zoom in",
    // zoomout: "Click to zoom out",
  };

  const FloatingTextInput = () => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [textInput.isVisible]);

    return textInput.isVisible ? (
      <input
        ref={inputRef}
        className="fixed bg-transparent text-white outline-none text-lg"
        style={{
          left: textInput.x * game!.getScale() + game!.getOffsetX(),
          top: textInput.y * game!.getScale() + game!.getOffsetY() - 10,
          fontSize: `${20 * game!.getScale()}px`,
          color: selectedColor,
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.currentTarget.value) {
            game?.addText(e.currentTarget.value, textInput.x, textInput.y);
            setTextInput({ ...textInput, isVisible: false });
            document.body.style.cursor = "crosshair";
          }
          if (e.key === "Escape") {
            setTextInput({ ...textInput, isVisible: false });
            document.body.style.cursor = "crosshair";
          }
        }}
        onBlur={() => setTextInput({ ...textInput, isVisible: false })}
      />
    ) : null;
  };

  useEffect(() => {
    game?.setTool(selectedTool);
    if (selectedTool === "text") document.body.style.cursor = "text";
    else if (selectedTool === "eraser")
      //   document.body.style.cursor = "url('/circle.png'), auto";
      document.body.style.cursor = "crosshair";
    else if (selectedTool === "pan") document.body.style.cursor = "move";
    else document.body.style.cursor = "crosshair";
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current && roomId) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);
    }

    return () => {
      game?.destroy();
    };
  }, [roomId, socket]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "1":
          setSelectedTool("pencil");
          break;
        case "2":
          setSelectedTool("line");
          break;
        case "3":
          setSelectedTool("rectangle");
          break;
        case "4":
          setSelectedTool("circle");
          break;
        case "5":
          setSelectedTool("text");
          break;
        case "6":
          setSelectedTool("eraser");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="overflow-hidden h-screen">
      <canvas
        ref={canvasRef}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          if (selectedTool === "text") {
            const transformedX =
              (e.clientX - game!.getOffsetX()) / game!.getScale();
            const transformedY =
              (e.clientY - game!.getOffsetY()) / game!.getScale();
            setTextInput({
              isVisible: true,
              x: transformedX,
              y: transformedY,
            });
          }
        }}
      ></canvas>
      <FloatingTextInput />
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        game={game}
      />
      <div className="fixed top-[5.5rem] left-1/2 -translate-x-1/2 text-white/50 text-sm">
        {toolDescriptions[selectedTool]}
      </div>
      <ColorBar
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
      />
    </div>
  );
}

function Topbar({
  selectedTool,
  setSelectedTool,
  game,
}: {
  selectedTool: Tool;
  setSelectedTool: (shape: Tool) => void;
  game: Game | null;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-4 bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 transition-all duration-300">
      <IconButton
        isActivated={selectedTool === "pencil"}
        icon={<PencilIcon />}
        onClick={() => {
          setSelectedTool("pencil");
        }}
        keybind="1"
        title="Pencil — 1"
      />
      <IconButton
        isActivated={selectedTool === "line"}
        icon={<SlashIcon />}
        onClick={() => {
          setSelectedTool("line");
        }}
        keybind="2"
        title="Line — 2"
      />
      <IconButton
        isActivated={selectedTool === "rectangle"}
        icon={<RectangleHorizontalIcon />}
        onClick={() => {
          setSelectedTool("rectangle");
        }}
        keybind="3"
        title="Rectangle — 3"
      />
      <IconButton
        isActivated={selectedTool === "circle"}
        icon={<CircleIcon />}
        onClick={() => {
          setSelectedTool("circle");
        }}
        keybind="4"
        title="Circle — 4"
      />
      <IconButton
        isActivated={selectedTool === "text"}
        icon={<BaselineIcon />}
        onClick={() => {
          setSelectedTool("text");
        }}
        keybind="5"
        title="Text — 5"
      />
      <div className="w-px h-6 bg-white/20" /> {/* Divider */}
      <IconButton
        isActivated={selectedTool === "eraser"}
        icon={<EraserIcon />}
        onClick={() => {
          setSelectedTool("eraser");
        }}
        keybind="6"
        title="Eraser — 6"
      />
      <IconButton
        isActivated={selectedTool === "pan"}
        icon={<MoveIcon />}
        onClick={() => {
          setSelectedTool("pan");
          document.body.style.cursor = "move";
        }}
        title="Pan Tool"
      />
      <IconButton
        icon={<ZoomInIcon />}
        // isActivated={selectedTool === "zoomin"}
        onClick={() => game?.zoomIn()}
        title="Zoom In"
      />
      <IconButton
        icon={<ZoomOutIcon />}
        // isActivated={selectedTool === "zoomout"}
        onClick={() => game?.zoomOut()}
        title="Zoom Out"
      />
    </div>
  );
}

function ColorBar({
  selectedColor,
  setSelectedColor,
}: {
  selectedColor: string;
  setSelectedColor: (color: any) => void;
}) {
  const colors = [
    "#FFFFFF",
    "#F43F5E",
    "#22D3EE",
    "#A3E635",
    "#FDE047",
    "#D946EF",
    "#FB923C",
    "#F472B6",
  ];

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/20">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => setSelectedColor(color)}
          style={{ backgroundColor: color }}
          className={`w-8 h-8 rounded-full transition-all duration-300 shadow-md
            ${
              selectedColor === color
                ? "scale-125 ring-2 ring-white/50 shadow-lg"
                : "hover:scale-110 hover:ring-2 hover:ring-white/30"
            }`}
        />
      ))}
    </div>
  );
}
