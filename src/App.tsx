import { useEffect, useRef, useState } from "react";
import "./css/App.css";
import vert from "./shader/vertex/fullscreen.wgsl?raw";
import frag from "./shader/fragment/gauss.wgsl?raw";
import { Card, Col, Row, Slider } from "antd";

function App() {
  const [mu, setMu] = useState(0.5);
  const [sigma, setSigma] = useState(0.2);
  const [frequency, setFrequency] = useState(1);
  const canvasWidth = 640;
  const canvasHeight = 480;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gpuRef = useRef<GPUDevice>(null);
  const canvasContextRef = useRef<GPUCanvasContext>(null);
  const colorFormatRef = useRef<GPUTextureFormat>(null);
  const pipelineRef = useRef<GPURenderPipeline>(null);
  const bindGroupRef = useRef<GPUBindGroup>(null);
  const uniformBufferRef = useRef<GPUBuffer>(null);

  useEffect(() => {
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
        size: 4 * 4,
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
          module: gpu.createShaderModule({ code: frag }),
          entryPoint: "main",
          targets: [{ format: colorFormat }],
        },
        primitive: {
          topology: "triangle-list",
        },
      });
      pipelineRef.current = pipeline;

      draw();
    }

    init();
  }, []);

  const draw = () => {
    const gpu = gpuRef.current!;
    const canvasContext = canvasContextRef.current!;
    const pipeline = pipelineRef.current!;
    const bindGroup = bindGroupRef.current!;
    const buffer = uniformBufferRef.current!;

    const params = new Float32Array([mu, sigma, frequency, canvasWidth]);
    gpu.queue.writeBuffer(buffer, 0, params);

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

  useEffect(() => {
    if (gpuRef.current && uniformBufferRef.current) {
      draw();
    }
  }, [mu, sigma, frequency]);

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
            <Row align={"middle"}>
              <Col span={12}>频率freq（条纹数量）：</Col>
              <Col span={12}>
                <Slider
                  min={1}
                  max={20}
                  onChange={(val: number) => setFrequency(val)}
                  value={frequency}
                />
              </Col>
            </Row>
            <Row align={"middle"}>
              <Col span={12}>中心位置μ（条纹位置）：</Col>
              <Col span={12}>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(val: number) => setMu(val)}
                  value={mu}
                />
              </Col>
            </Row>
            <Row align={"middle"}>
              <Col span={12}>宽度σ (条纹宽度)：</Col>
              <Col span={12}>
                <Slider
                  min={0.001}
                  max={0.5}
                  step={0.001}
                  onChange={(val: number) => setSigma(val)}
                  value={sigma}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default App;
