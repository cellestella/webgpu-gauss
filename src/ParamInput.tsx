import { Col, Row, Slider } from "antd";

interface ParamInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

export function ParamInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: ParamInputProps) {
  return (
    <Row align="middle" style={{ marginBottom: 16 }}>
      <Col span={12}>{label}</Col>
      <Col span={12}>
        <Row align="middle">
          <Col span={4} style={{ textAlign: "right" }}>
            {value}
          </Col>
          <Col span={1}></Col>
          <Col span={19}>
            <Slider
              min={min}
              max={max}
              step={step}
              onChange={onChange}
              value={value}
              style={{ flex: 1 }}
            />
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
