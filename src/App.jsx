import React, { useState } from 'react';

function App() {
  const [networkInput, setNetworkInput] = useState('');
  const [ip, setIp] = useState('');
  const [calcData, setCalcData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [fade, setFade] = useState(false);

  // Convert IP string to 32-bit unsigned number
  function ipToNumber(ipStr) {
    const parts = ipStr.trim().split('.');
    if (parts.length !== 4) throw new Error('Invalid IP format');
    return parts.reduce((acc, part) => {
      if (part === '') throw new Error('Invalid IP format');
      const n = Number(part);
      if (isNaN(n) || n < 0 || n > 255) throw new Error('IP parts must be 0-255');
      return (acc << 8) + n;
    }, 0) >>> 0; // force unsigned
  }

  // Convert 32-bit unsigned number to IP string
  function numberToIp(num) {
    return [
      (num >>> 24) & 0xff,
      (num >>> 16) & 0xff,
      (num >>> 8) & 0xff,
      num & 0xff,
    ].join('.');
  }

  // CIDR to subnet mask string (e.g. 24 -> 255.255.255.0)
  function cidrToMask(cidr) {
    return numberToIp(~((1 << (32 - cidr)) - 1) >>> 0);
  }

  // Calculate network address from IP and CIDR
  function calculateNetworkAddress(ipNum, cidr) {
    const maskNum = ~((1 << (32 - cidr)) - 1) >>> 0;
    return ipNum & maskNum;
  }

  // Gateway is network + 1 (usually)
  function calculateGateway(networkNum) {
    return networkNum + 1;
  }

  function handleCalculate() {
    setError('');
    setCalcData(null);

    try {
      if (!networkInput.includes('/')) {
        throw new Error('Network must be in CIDR format, e.g. 192.168.100.0/24');
      }

      const [networkIpStr, cidrStr] = networkInput.split('/');
      const cidrNum = Number(cidrStr);
      if (isNaN(cidrNum) || cidrNum < 0 || cidrNum > 32) throw new Error('CIDR must be between 0 and 32');

      const networkIpNum = ipToNumber(networkIpStr);
      const ipNum = ipToNumber(ip);

      const networkAddressNum = calculateNetworkAddress(networkIpNum, cidrNum);
      const maskStr = cidrToMask(cidrNum);
      const gatewayNum = calculateGateway(networkAddressNum);

      // Validate IP is in network
      const maskNum = ~((1 << (32 - cidrNum)) - 1) >>> 0;
      if ((ipNum & maskNum) !== networkAddressNum) {
        throw new Error('IP is not in the specified network range');
      }

      setCalcData({
        networkAddress: `${numberToIp(networkAddressNum)}/${cidrNum}`,
        ip,
        gateway: numberToIp(gatewayNum),
        subnetMask: maskStr,
        dns1: '8.8.8.8',
        dns2: '8.8.4.4',
      });
    } catch (e) {
      setError(e.message);
    }
  }

  function copyResultText() {
    if (!calcData) return;
    const textToCopy = `
IP: ${calcData.ip}
Gateway: ${calcData.gateway}
Subnet: ${calcData.subnetMask}
DNS1: ${calcData.dns1}
DNS2: ${calcData.dns2}
    `.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setFade(true); // Start visible & fully opaque
      // After 1.5 seconds start fading
      setTimeout(() => setFade(false), 1500);
      // After 2 seconds hide completely
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const predefinedNetworks = [
    { label: "Network1/CIDR", value: "192.168.1.0/27" },
    { label: "Network2/CIDR", value: "192.168.10.20/24" },
  ];

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        padding: 20,
        backgroundColor: '#f7f7f0',
      }}
    >
      <div
        style={{
          width: '80%',
          maxWidth: 400,
          backgroundColor: 'rgb(159, 41, 67)',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginBottom: 20, color: 'white' }}>Network Calculator</h2>

        <label style={{ display: 'block', textAlign: 'left', marginBottom: 10, color: 'white' }}>
          Network/CIDR:
          <select
            value={networkInput}
            onChange={(e) => setNetworkInput(e.target.value)}
            style={{ width: '100%', marginTop: 4, marginBottom: 10, padding: 8 }}
          >
            <option value="">Select Network/CIDR</option>
            {predefinedNetworks.map((net) => (
              <option key={net.value} value={net.value}>
                {net.label} ({net.value})
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'block', textAlign: 'left', marginBottom: 15, color: 'white' }}>
          IP Address:
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            style={{
              width: '100%',
              marginTop: 6,
              padding: 8,
              fontSize: 16,
              borderRadius: 4,
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
            placeholder="192.168.100.10"
          />
        </label>

        <button
          onClick={handleCalculate}
          className="calculate-button"
          style={{
            padding: '10px 25px',
            cursor: 'pointer',
            fontSize: 16,
            border: 'none',
            color: 'white',
            marginBottom: 20,
            width: '100%',
          }}
        >
          Calculate
        </button>

        {error && (
          <div
            className="pulse"
            style={{
              color: 'white',
              marginBottom: 15,
              fontWeight: 'bold',
            }}
          >
            {error}
          </div>
        )}

        {calcData && (
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: 20,
              borderRadius: 6,
              textAlign: 'left',
              fontSize: 16,
              lineHeight: 1.5,
              userSelect: 'text',
            }}
          >
            <div style={{ marginBottom: 15 }}>
              <strong>Network Address:</strong> {calcData.networkAddress}
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>IP:</strong> {calcData.ip}<br />
              <strong>Gateway:</strong> {calcData.gateway}<br />
              <strong>Subnet Mask:</strong> {calcData.subnetMask}<br />
              <strong>DNS1:</strong> {calcData.dns1}<br />
              <strong>DNS2:</strong> {calcData.dns2}
            </div>

            <button
              onClick={copyResultText}
              className='calculate-button'
              style={{
                padding: '8px 18px',
                fontSize: 14,
                color: 'white',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Copy Results
            </button>
            {copied && (
              <span
                style={{
                  marginLeft: 10,
                  color: 'green',
                  opacity: fade ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}
              >
                Copied
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
