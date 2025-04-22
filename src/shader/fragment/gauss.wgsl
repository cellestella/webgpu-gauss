struct Params {
  mu: f32,
  sigma: f32,
  frequency: f32,
  screenWidth: f32,
};

@group(0) @binding(0)
var<uniform> params: Params;

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    // 高斯函数公式： f(x) = exp( -((x - μ)²) / (2 * σ²) ), exp(x) = 指数函数，e 的 x 次方
    // μ 代表条纹的中心位置，σ 决定了条纹的宽度
    
    // 这个片元着色器，会对画布上的每个像素应用一遍，pos 则代表了当前像素的坐标

    let screenWidth = params.screenWidth;
    // 将当前像素的 x 坐标归一化到 [0, 1] 区间
    // x 从 0 变化到 1 时，相当于在画布上从左到右对应了一整个高斯函数
    let x = pos.x / screenWidth;

    // 高斯峰的中心位置（屏幕中间）
    let mu = params.mu;      
    // 控制高斯条纹的宽度（越小越细，越大越宽）
    let sigma = params.sigma;   
    // 每屏幕上出现多少个高斯峰 (多少个周期)
    let frequency = params.frequency;
    // 每个周期的宽度
    let period = 1.0 / frequency; 

    // 当前像素在当前周期内的相对位置，标准化成 0~1 的范围
    let x_in_period = (x % period) / period;

    // 计算当前像素与中心位置的距离
    let dx = x_in_period - mu;
    // 代入高斯函数公式，计算亮度值，越靠近中心的点越亮
    let gauss = exp(-dx * dx / (2.0 * sigma * sigma));

    // 用计算好的亮度值渲染当前像素
    return vec4<f32>(gauss, gauss, gauss, 1.0);
}
