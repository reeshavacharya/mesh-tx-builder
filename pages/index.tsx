import Head from "next/head";
import { CardanoWallet } from "@meshsdk/react";
import Mint from "./components/Mint";
import fetch from 'node-fetch';

export default function Home() {
  return (
    <div className="container">
      <main className="main">
        <div className="demo">
          <CardanoWallet />
        </div>
        <Mint />
      </main>
    </div>
  );
}
