import { useMemo, useState } from "react";
import { ethers } from "ethers";
import contractInfo from "./contract-info.json";
import "./App.css";

const RPC_URL = "http://127.0.0.1:8545";

function statusName(status) {
  const statuses = ["Created", "Shipped", "Received", "Sold"];
  return statuses[Number(status)] || "Unknown";
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function App() {
  const [productName, setProductName] = useState("PTIT Laptop");
  const [serial, setSerial] = useState("PTIT-2026-001");
  const [origin, setOrigin] = useState("Hanoi Factory");

  const [productId, setProductId] = useState("");
  const [productHash, setProductHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);

  const currentStep = useMemo(() => {
    if (!productInfo) return 0;
    const status = productInfo.status;
    if (status === "Created") return 1;
    if (status === "Shipped") return 2;
    if (status === "Received") return 3;
    if (status === "Sold") return 4;
    return 0;
  }, [productInfo]);

  function addLog(message, type = "info") {
    setLogs((prev) => [
      {
        message,
        type,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  }

  async function getContract(signerIndex = 0) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = await provider.getSigner(signerIndex);

    const contract = new ethers.Contract(
      contractInfo.address,
      contractInfo.abi,
      signer
    );

    return { provider, signer, contract };
  }

  async function authorizeParticipants() {
    try {
      const { provider, contract } = await getContract(0);

      const distributor = await provider.getSigner(1);
      const retailer = await provider.getSigner(2);

      let tx = await contract.authorizeParticipant(await distributor.getAddress());
      await tx.wait();

      tx = await contract.authorizeParticipant(await retailer.getAddress());
      await tx.wait();

      addLog("Distributor and Retailer were authorized successfully.", "success");
    } catch (error) {
      addLog(error.message, "error");
    }
  }

  async function createProduct() {
    try {
      const { contract } = await getContract(0);

      const productData = `Product: ${productName} | Serial: ${serial} | Origin: ${origin}`;
      const hash = ethers.id(productData);

      const tx = await contract.createProduct(productName, origin, hash);
      const receipt = await tx.wait();

      const count = await contract.productCount();

      setProductId(count.toString());
      setProductHash(hash);

      addLog(`Product created successfully. Product ID: ${count.toString()}`, "success");
      addLog(`Transaction hash: ${tx.hash}`, "tx");
      addLog(`Included in block number: ${receipt.blockNumber}`, "tx");

      await loadProductInfoById(count.toString());
    } catch (error) {
      addLog(error.message, "error");
    }
  }

  async function updateToShipped() {
    try {
      if (!productId) {
        addLog("Please create a product first.", "error");
        return;
      }

      const { contract } = await getContract(1);

      const tx = await contract.updateStatus(productId, 1, "Hanoi Warehouse");
      const receipt = await tx.wait();

      addLog("Product status updated to Shipped by Distributor.", "success");
      addLog(`Transaction hash: ${tx.hash}`, "tx");
      addLog(`Included in block number: ${receipt.blockNumber}`, "tx");

      await loadProductInfoById(productId);
    } catch (error) {
      addLog(error.message, "error");
    }
  }

  async function updateToReceived() {
    try {
      if (!productId) {
        addLog("Please create a product first.", "error");
        return;
      }

      const { contract } = await getContract(2);

      const tx = await contract.updateStatus(productId, 2, "PTIT Retail Store");
      const receipt = await tx.wait();

      addLog("Product status updated to Received by Retailer.", "success");
      addLog(`Transaction hash: ${tx.hash}`, "tx");
      addLog(`Included in block number: ${receipt.blockNumber}`, "tx");

      await loadProductInfoById(productId);
    } catch (error) {
      addLog(error.message, "error");
    }
  }

  async function verifyProduct() {
    try {
      if (!productId || !productHash) {
        addLog("Please create a product first.", "error");
        return;
      }

      const { contract } = await getContract(0);

      const originalValid = await contract.verifyProduct(productId, productHash);

      const tamperedProductData = `Product: FAKE ${productName} | Serial: ${serial} | Origin: Unknown`;
      const tamperedHash = ethers.id(tamperedProductData);

      const tamperedValid = await contract.verifyProduct(productId, tamperedHash);

      setVerifyResult({
        original: originalValid,
        tampered: tamperedValid,
        tamperedHash,
      });

      addLog(`Original product verification result: ${originalValid}`, "success");
      addLog(`Tampered product verification result: ${tamperedValid}`, "success");
    } catch (error) {
      addLog(error.message, "error");
    }
  }

  async function loadProductInfoById(id) {
    const { contract } = await getContract(0);

    const product = await contract.getProduct(id);

    setProductInfo({
      id: product[0].toString(),
      name: product[1],
      origin: product[2],
      hash: product[3],
      status: statusName(product[4]),
      currentHandler: product[5],
      createdAt: product[6].toString(),
    });

    const historyCount = Number(await contract.getHistoryCount(id));
    const records = [];

    for (let i = 0; i < historyCount; i++) {
      const record = await contract.getHistoryRecord(id, i);

      records.push({
        index: i + 1,
        status: statusName(record[0]),
        location: record[1],
        updatedBy: record[2],
        timestamp: record[3].toString(),
      });
    }

    setHistory(records);
  }

  async function loadProductInfo() {
    try {
      if (!productId) {
        addLog("Please create a product first.", "error");
        return;
      }

      await loadProductInfoById(productId);
      addLog("Product information and blockchain history loaded.", "success");
    } catch (error) {
      addLog(error.message, "error");
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Advanced Information Security Demo</p>
          <h1>Blockchain Supply Chain Tracking</h1>
          <p className="hero-text">
            A local Ethereum blockchain demo using Hardhat, Solidity and React.
            The system tracks product status, records transactions and verifies
            whether product data has been tampered with.
          </p>
        </div>

        <div className="hero-card">
          <span>Smart Contract</span>
          <strong>{shortAddress(contractInfo.address)}</strong>
          <p>{RPC_URL}</p>
        </div>
      </section>

      <section className="workflow-card">
        <div className={`flow-step ${currentStep >= 1 ? "active" : ""}`}>
          <div>1</div>
          <span>Created</span>
          <small>Manufacturer</small>
        </div>
        <div className="flow-line"></div>
        <div className={`flow-step ${currentStep >= 2 ? "active" : ""}`}>
          <div>2</div>
          <span>Shipped</span>
          <small>Distributor</small>
        </div>
        <div className="flow-line"></div>
        <div className={`flow-step ${currentStep >= 3 ? "active" : ""}`}>
          <div>3</div>
          <span>Received</span>
          <small>Retailer</small>
        </div>
        <div className="flow-line"></div>
        <div className={`flow-step ${currentStep >= 4 ? "active" : ""}`}>
          <div>4</div>
          <span>Sold</span>
          <small>Customer</small>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Product Registration</p>
              <h2>Create Product</h2>
            </div>
            <span className="badge">On-chain</span>
          </div>

          <label>Product name</label>
          <input value={productName} onChange={(e) => setProductName(e.target.value)} />

          <label>Serial number</label>
          <input value={serial} onChange={(e) => setSerial(e.target.value)} />

          <label>Origin</label>
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} />

          <div className="button-grid">
            <button onClick={authorizeParticipants}>Authorize Participants</button>
            <button onClick={createProduct}>Create Product</button>
            <button onClick={updateToShipped}>Update to Shipped</button>
            <button onClick={updateToReceived}>Update to Received</button>
            <button onClick={verifyProduct}>Verify Product</button>
            <button onClick={loadProductInfo}>View History</button>
          </div>
        </div>

        <div className="panel dark-panel">
          <p className="eyebrow">Current State</p>
          <h2>Product Information</h2>

          {productInfo ? (
            <div className="info-list">
              <div>
                <span>Product ID</span>
                <strong>{productInfo.id}</strong>
              </div>
              <div>
                <span>Name</span>
                <strong>{productInfo.name}</strong>
              </div>
              <div>
                <span>Origin</span>
                <strong>{productInfo.origin}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong className="status-badge">{productInfo.status}</strong>
              </div>
              <div>
                <span>Current Handler</span>
                <strong>{shortAddress(productInfo.currentHandler)}</strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Create a product to show blockchain state here.
            </div>
          )}

          {productHash && (
            <div className="hash-box">
              <span>Product Hash</span>
              <code>{productHash}</code>
            </div>
          )}
        </div>
      </section>

      {verifyResult && (
        <section className="verify-section">
          <div className="verify-card success">
            <span>Original Product</span>
            <strong>{String(verifyResult.original)}</strong>
            <p>The original product hash matches the hash stored on blockchain.</p>
          </div>

          <div className="verify-card danger">
            <span>Tampered Product</span>
            <strong>{String(verifyResult.tampered)}</strong>
            <p>The modified product data generates a different hash and fails verification.</p>
          </div>
        </section>
      )}

      <section className="grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Audit Trail</p>
              <h2>Product History on Blockchain</h2>
            </div>
          </div>

          {history.length > 0 ? (
            <div className="timeline">
              {history.map((record) => (
                <div className="timeline-item" key={record.index}>
                  <div className="timeline-dot"></div>
                  <div>
                    <strong>{record.status}</strong>
                    <p>{record.location}</p>
                    <small>
                      Updated by {shortAddress(record.updatedBy)} · Timestamp {record.timestamp}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No history yet. Create or update a product to generate blockchain records.
            </div>
          )}
        </div>

        <div className="panel logs-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Transactions</p>
              <h2>Blockchain Logs</h2>
            </div>
          </div>

          <div className="logs">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div className={`log-line ${log.type}`} key={index}>
                  <span>{log.time}</span>
                  <p>{log.message}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                Transaction logs will appear here.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
