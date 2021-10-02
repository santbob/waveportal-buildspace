import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import './App.css';
import contractABI from './utils/WavePortal.json';
import { FaEthereum } from 'react-icons/fa';
import {GiTrophyCup} from 'react-icons/gi';


export default function App() {
  /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [waveCount, setWaveCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wavePortalContract, setWavePortalContract] = useState(null)
  const [allWaves, setAllWaves] = useState([])
  const [waveMessage, setWaveMessage] = useState('')

  const contractAddress = "0x597da3BdbDd7dc003Cc6dd2D6e0c462E19672db7";
  const checkIfWalletIsConnected = async () => {
    try {
      const {ethereum} = window;

      if(!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the etherum object ", ethereum)
      }

      const accounts = await ethereum.request({method: "eth_accounts"});

      if(accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account ", account);
        setCurrentAccount(account)
        await loadContract()
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  },[])

  const loadContract = async () => {
    try {
      const {ethereum} = window;

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
        setWavePortalContract(contract)
        await loadWaveCount(contract)
        await getAllWaves(contract)
      } else {
        console.log("ethereum object doesn't exist");
      }
    } catch ( error) {
      console.log(error)
    }
  }


  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if(!ethereum) {
        alert("Get MetaMask");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts"});

      console.log("Connected", accounts[0])

      await loadContract()
      setCurrentAccount(accounts[0])

    } catch (error) {
      console.log(error)
    }
  }

  const loadWaveCount = async (contract) => {
    const count = await contract.getTotalWaves();
    setWaveCount(count.toNumber())
    console.log("Retrieved total wave count...", count.toNumber());
  }

  const wave = async () => {
    try {
      const {ethereum} = window;

      if(ethereum) {
      
        await loadWaveCount(wavePortalContract)


        const waveTxn = await wavePortalContract.wave(waveMessage || "", { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);
        setLoading(true);
        setWaveMessage('');

        await waveTxn.wait();
        console.log("Mined...", waveTxn.hash)

        await loadWaveCount(wavePortalContract);

        setLoading(false);
        
        await getAllWaves(wavePortalContract)

      } else {
        console.log("ethereum object doesn't exist");
      }
    } catch ( error) {
      console.log(error)
      alert("Transaction Failed, please try again.")
      setLoading(false)
    }
  }
  
  const getAllWaves = async (contract) => {
    try {
      const waves = await contract.getAllWaves();

      const wavesData = []

      waves.forEach(wave => {
        wavesData.push({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
          winner: wave.winner
        })
      })

      console.log({wavesData})

      setAllWaves(wavesData)

    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 வணக்கம் மக்களே
        </div>

        <div className="bio">
        நான் சந்தோஷ், வெப் 3 இல் தொடங்குவதில் நான் மிகவும் மகிழ்ச்சியடைகிறேன்! உங்கள் Ethereum பணப்பையை இணைத்து என்னை அலையுங்கள்!
        </div>

        {loading && (<div className="loader">
            Waving and waiting for Transaction to complete...
        </div>
        )}

       {!loading && currentAccount && (
          <div className="waveForm">
              <div className="waves">
                  I was waved <b>{waveCount}</b> times
              </div>
              <input type="text" value={waveMessage} onChange={(e) => setWaveMessage(e.target.value)} />
              <button className="waveButton" onClick={wave}>
                👋 Wave at Me
              </button>
          </div>
        )}
        {
          /*
          * If there is no currentAccount render the connect wallet button
          */
        }
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet 
          </button>
        )}
      {allWaves && (
        <ul className="wavesList">
            {allWaves.map((wave, index) => {
          return (
            <li key={index}>
              <div className="who"><FaEthereum /> {wave.address} {wave.winner && (<GiTrophyCup className="winner"/>)}</div>
              <div className="message">{wave.message}</div>
              <div className="dateTime">{wave.timestamp.toLocaleString()}</div>
            </li>)
        })}
        </ul>
      )}
        
      </div>
    </div>
  );
}
