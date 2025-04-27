import { useEffect, useRef, useState } from "react";
import "./css/App.css";
import vert from "./shader/vertex/fullscreen.wgsl?raw";
import frag from "./shader/fragment/gauss.wgsl?raw";
import stress from "./shader/fragment/stress.wgsl?raw";
import { Card, Col, Row } from "antd";
import { ParamInput } from "./ParamInput";
import { FpsMonitor } from "./FpsMonitor";

function App() {
  const [params, setParams] = useState({
    mu: 0.5,
    sigma: 0.2,
    frequency: 1,
    stressLevel: 0,
  });
  const stressTestEnabled = params.stressLevel > 0;
  const canvasWidth = 640;
  const canvasHeight = 480;

  const paramsRef = useRef(params);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gpuRef = useRef<GPUDevice>(null);
  const canvasContextRef = useRef<GPUCanvasContext>(null);
  const colorFormatRef = useRef<GPUTextureFormat>(null);
  const pipelineRef = useRef<GPURenderPipeline>(null);
  const bindGroupRef = useRef<GPUBindGroup>(null);
  const uniformBufferRef = useRef<GPUBuffer>(null);
  const animationFrameRef = useRef<number>(null);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  async function init() {
    const adapter = await navigator.gpu?.requestAdapter();
    const gpu = await adapter?.requestDevice();
    if (!gpu) throw new Error("WebGPU not supported");
    gpu.lost.then(() => {
      throw new Error("GPU device lost");
    });

    const canvas = canvasRef.current!;
    const canvasContext = canvas.getContext("webgpu")!;
    const colorFormat = navigator.gpu.getPreferredCanvasFormat();
    canvasContext.configure({ device: gpu, format: colorFormat });

    gpuRef.current = gpu;
    canvasContextRef.current = canvasContext;
    colorFormatRef.current = colorFormat;

    const uniformBuffer = gpu.createBuffer({
      size: 5 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    uniformBufferRef.current = uniformBuffer;

    const bindGroupLayout = gpu.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });
    const bindGroup = gpu.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
      ],
    });
    bindGroupRef.current = bindGroup;

    const pipelineLayout = gpu.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });
    const pipeline = gpu.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: gpu.createShaderModule({ code: vert }),
        entryPoint: "main",
      },
      fragment: {
        module: gpu.createShaderModule({
          code: !stressTestEnabled ? frag : stress,
        }),
        entryPoint: "main",
        targets: [{ format: colorFormat }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
    pipelineRef.current = pipeline;

    loopPerFrame();
  }

  const draw = () => {
    const gpu = gpuRef.current;
    const canvasContext = canvasContextRef.current;
    const pipeline = pipelineRef.current;
    const bindGroup = bindGroupRef.current;
    const buffer = uniformBufferRef.current;
    if (!gpu || !canvasContext || !pipeline || !bindGroup || !buffer) return;

    const { mu, sigma, frequency, stressLevel } = paramsRef.current;
    const data = new Float32Array([
      mu,
      sigma,
      frequency,
      canvasWidth,
      stressLevel,
    ]);
    gpu.queue.writeBuffer(buffer, 0, data);

    const commandEncoder = gpu.createCommandEncoder();
    const textureView = canvasContext.getCurrentTexture().createView();
    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(3);
    pass.end();
    gpu.queue.submit([commandEncoder.finish()]);
  };

  const loopPerFrame = () => {
    draw();
    animationFrameRef.current = requestAnimationFrame(loopPerFrame);
  };

  const exit = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    init();
    return exit;
  }, [stressTestEnabled]);

  return (
    <div style={{ margin: 32 }}>
      <Row>
        <Col span={24}>
          <h2>WebGPU 高斯条纹渲染</h2>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={14}>
          <Card title={"高斯条纹图像"}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
              />
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <Card title={"参数"}>
            <ParamInput
              label="频率 Frequency（条纹数量）"
              value={params.frequency}
              min={1}
              max={20}
              onChange={(value) =>
                setParams((p) => ({ ...p, frequency: value }))
              }
            />
            <ParamInput
              label="中心位置 μ（条纹位置）"
              value={params.mu}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => setParams((p) => ({ ...p, mu: value }))}
            />
            <ParamInput
              label="宽度 σ（条纹宽度）"
              value={params.sigma}
              min={0.001}
              max={0.5}
              step={0.005}
              onChange={(value) => setParams((p) => ({ ...p, sigma: value }))}
            />
            <ParamInput
              label="压力测试等级（逐渐增加，避免GPU负载过高卡死）"
              value={params.stressLevel}
              min={0}
              max={20}
              step={1}
              onChange={(value) =>
                setParams((p) => ({ ...p, stressLevel: value }))
              }
            />
            <Row>
              <Col>
                <FpsMonitor />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default App;
