import { useEffect, useRef } from "react";
import "./css/App.css";
import vert from "./shader/vertex/fullscreen.wgsl?raw";
import frag from "./shader/fragment/gauss.wgsl?raw";

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
    if (!canvasRef.current || !context) {
      throw new Error("Canvas initialization failed");
    }
    const colorFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: colorFormat,
    });
    const params = new Float32Array([
      0.5, // mu
      0.2, // sigma
      10.0, // frequency
      canvasRef.current.width, // screen width
    ]);
    const uniformBuffer = device.createBuffer({
      size: params.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, params);
    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });
    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
      ],
    });
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
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
      layout: pipelineLayout,
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
      passEncoder.setBindGroup(0, bindGroup);
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
