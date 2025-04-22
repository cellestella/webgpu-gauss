@vertex
fn main(@builtin(vertex_index) VertexIndex: u32) -> @builtin(position) vec4<f32> {
    //用来画一个在屏幕中间的等边三角形，返回三角形的三个顶点的位置
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>(0.5, -0.5)
    );

    return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}