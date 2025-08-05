import Image from "next/image";
import Ble from "./Ble"
export default function Home() {
  return (
    <div className="grid items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
       <Ble />
    </div>
  );
}
