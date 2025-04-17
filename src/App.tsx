import './App.css'
import { useEffect } from 'react'
function App() {

  async function init() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
      throw Error("WebGPU not supported.");
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
