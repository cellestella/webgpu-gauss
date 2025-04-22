import { useEffect, useRef } from "react";
import "./css/App.css";
import vert from "./shader/vertex/triangle.wgsl?raw";
import frag from "./shader/fragment/red.wgsl?raw";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function init() {
    //获取显卡的引用，保存到device
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
      throw new Error("WebGPU not supported");
    }
    device.lost.then(() => {
      throw new Error("GPU device lost");
    });
    //初始化用于绘制的画布，与显卡绑定
    const context = canvasRef.current?.getContext("webgpu");
    if (!context) {
      throw new Error("Canvas initialization failed");
    }
    const colorFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: colorFormat,
    });
    const renderPipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: vert,
        }),
        entryPoint: "main",
      },
      fragment: {
        module: device.createShaderModule({
          code: frag,
        }),
        entryPoint: "main",
        targets: [{ format: colorFormat }],
      },
      primitive: {
        topology: "triangle-list",
      },
      layout: "auto",
    });

    const draw = () => {
      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      };
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(renderPipeline);
      passEncoder.draw(3);
      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);
    };

    draw();
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={640} height={480} />
    </div>
  );
}

export default App;
