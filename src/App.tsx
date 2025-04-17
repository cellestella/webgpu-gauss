import './App.css'
import { useEffect } from 'react'
function App() {

  async function init() {
    if (!navigator.gpu) {
      throw Error("WebGPU not supported.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw Error("Couldn't request WebGPU adapter.");
    }
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <h1>Hello World</h1>
    </div>
  )
}

export default App
