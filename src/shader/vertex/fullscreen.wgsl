@vertex
fn main(@builtin(vertex_index) VertexIndex: u32) -> @builtin(position) vec4<f32> {
    //画一个可以完全“包含”整个画布的大三角形，为了让画布上的每个像素都触发一次片元着色器
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0), 
        vec2<f32>(3.0, -1.0),  
        vec2<f32>(-1.0, 3.0)   
    );
    return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}
