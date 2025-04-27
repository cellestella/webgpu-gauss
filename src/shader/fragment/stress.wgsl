struct Params {
  mu: f32,
  sigma: f32,
  frequency: f32,
  screenWidth: f32,
  stressLevel: f32
};

@group(0) @binding(0)
var<uniform> params: Params;

fn extra_stress(x: f32, level: i32) -> f32 {
  var acc = x;
  // 高强度运算
  for (var i = 0; i < 1000 * level; i = i + 1) {
    acc = sin(acc) + cos(acc) + exp(-acc * acc) + sqrt(abs(acc));
  }
  return acc;
}

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let screenWidth = params.screenWidth;
  let x = pos.x / screenWidth;
  let mu = params.mu;
  let sigma = params.sigma;
  let frequency = params.frequency;
  let stressLevel = i32(params.stressLevel);

  let period = 1.0 / frequency;
  let x_in_period = (x % period) / period;
  let dx = x_in_period - mu;
  let gauss = exp(-dx * dx / (2.0 * sigma * sigma));

  // 执行高负载运算，并将结果掺一点点到最终颜色，防止GPU优化，同时避免画面失真太严重
  let stressValue = extra_stress(gauss, stressLevel);

  let finalColor = clamp(gauss * 0.99 + (stressValue * 0.01), 0.0, 1.0);

  return vec4f(finalColor, finalColor, finalColor, 1.0);
}
