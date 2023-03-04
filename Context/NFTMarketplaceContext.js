import React, { useState } from "react";
import config from "../config/config.json";
import NFT_ABI from "../config/NFTMarketplace.json";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import axios from "axios";
import { subdomain, client } from "./ipfsConfig";

const fetchContract = async (signerOrProvider) => {
  const web3Modal = new Web3Modal();
  const connection = await web3Modal.connect();
  const provider = new ethers.providers.Web3Provider(connection);
  const { chainId } = await provider.getNetwork();

  const nftConfig = config[chainId].cycloneNFT;
  const nftContract = new ethers.Contract(
    nftConfig.address,
    NFT_ABI,
    signerOrProvider
  );
  return nftContract;
};
// Connect to SmartContract
const connectingWithSmartContract = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);
    return contract;
  } catch (error) {
    console.log(
      `Ran into an error while connecting to Smart Contract ${error}`
    );
  }
};

export const NFTMarketplaceContext = React.createContext();

// Truncate Strings
const truncateString = (str, number) => {
  if (str?.length > number) {
    return str.slice(0, number) + "...";
  } else {
    return str;
  }
};

export const NFTMarketplaceProvider = ({ children }) => {
  const [success, setSuccess] = useState("");
  const [openSuccess, setOpenSuccess] = useState(false);
  const [error, setError] = useState("");
  const [openError, setOpenError] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");

  const router = useRouter();

  const ConnectToWallet = async () => {
    try {
      if (!window.ethereum)
        return setOpenError(true), setError("Oops, Install a Wallet");

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        setError("No available account found");
        setOpenError(true);
      }
    } catch (error) {
      setError("Wallet is not connected");
      setOpenError(true);
    }
  };

  const checkWalletNetwork = async () => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const { chainId } = await provider.getNetwork();

    if (chainId === 31337 || chainId === 80001 || chainId === 5) {
      return true;
    } else {
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum)
        return setOpenError(true), setError("Install MetaMask");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
      connectingWithSmartContract();

      setSuccess("Successfully Connected to Wallet");
      setOpenSuccess(true);
    } catch (error) {
      setError("Error while connecting to Wallet");
      setOpenError(true);
    }
  };

  const uploadToIPFS = async (file) => {
    try {
      const added = await client.add({ content: file });

      const url = `${subdomain}/ipfs/${added.path}`;

      return url;
    } catch (error) {
      setError("Error Uploading to IPFS");
      setOpenError(true);
    }
  };

  const createNFT = async (name, price, image, description, router) => {
    const connectNetwork = await checkWalletNetwork();

    if (!name || !description || !price || !image)
      return setError("Data Is Missing"), setOpenError(true);

    if (!connectNetwork)
      return (
        setError("Please connect to either Mumbai or Goerli Network"),
        setOpenError(true)
      );

    const data = JSON.stringify({ name, description, image });

    try {
      const added = await client.add(data);

      const url = `${subdomain}/ipfs/${added.path}`;

      await createSale(url, price);

      router.push("/searchPage");
    } catch (error) {
      setError("Error while creating NFT");
      setOpenError(true);
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    if (!url || !formInputPrice)
      return (
        setError("Please input the price"), setOpenError(true), "Empty input"
      );

    try {
      const price = ethers.utils.parseUnits(formInputPrice, "ether");

      const contract = await connectingWithSmartContract();

      const listingPrice = await contract.getListingPrice();

      const transaction = !isReselling
        ? await contract.createMarketItemToken(url, price, {
            value: listingPrice.toString(),
          })
        : await contract.resellToken(id, price, {
            value: listingPrice.toString(),
          });

      await transaction.wait();

      setSuccess("Transaction successfull");
      setOpenSuccess(true);
    } catch (error) {
      console.log(`Error while creating sale!: ${error}`);
      setError("Transaction Error");
      setOpenError(true);
    }
  };

  const fetchNFTs = async () => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);

      const connectNetwork = await checkWalletNetwork();

      if (!connectNetwork)
        return (
          setError("Please connect to either Mumbai or Goerli Network"),
          setOpenError(true)
        );

      const contract = await fetchContract(provider);
      const data = await contract.fetchMarketItems();
      const items = await Promise.all(
        data.map(
          async ({ tokenId, seller, owner, price: unformattedPrice }) => {
            const tokenURI = await contract.tokenURI(tokenId);
            const {
              data: { image, name, description },
            } = await axios.get(tokenURI, {});

            const price = ethers.utils.formatUnits(
              unformattedPrice.toString(),
              "ether"
            );

            return {
              price,
              tokenId: tokenId.toNumber(),
              seller,
              owner,
              image,
              name,
              description,
              tokenURI,
            };
          }
        )
      );
      console.log("working...", items);

      setOpenError(false);
      return items;
    } catch (error) {
      console.log(error);
      setError("Error while fetching NFTS");
      setOpenError(true);
    }
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    try {
      const connectNetwork = await checkWalletNetwork();

      if (!connectNetwork)
        return (
          setError("Please connect to either Mumbai or Goerli Network"),
          setOpenError(true)
        );

      const contract = await connectingWithSmartContract();

      const data =
        type == "fetchItemsListed"
          ? await contract.fetchItemsListed()
          : await contract.fetchMyNFTs();

      const items = await Promise.all(
        data.map(
          async ({ tokenId, seller, owner, price: unformattedPrice }) => {
            const tokenURI = await contract.tokenURI(tokenId);

            const {
              data: { image, name, description },
            } = await axios.get(tokenURI, {});

            const price = ethers.utils.formatUnits(
              unformattedPrice.toString(),
              "ether"
            );

            return {
              price,
              tokenId: tokenId.toNumber(),
              seller,
              owner,
              image,
              name,
              description,
              tokenURI,
            };
          }
        )
      );
      return items;
    } catch (error) {
      console.log(error);
      setError("Error while fetching listed NFTs");
      setOpenError(true);
    }
  };

  const buyNFT = async (nft) => {
    try {
      const contract = await connectingWithSmartContract();
      const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

      console.log();
      const transaction = await contract.createMarketSale(nft.tokenId, {
        value: price,
      });

      await transaction.wait();

      setSuccess(" NFT Purchase Successfull");
      setOpenSuccess(true);

      router.push("/author");
    } catch (error) {
      setError("Error While buying NFT");
      setOpenError(true);
    }
  };

  const updateListingPrice = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);
      const listingPrice = ethers.utils.parseEther(newPrice);
      await contract.updateListingPrice(listingPrice);
      setNewPrice("");
      setSuccess("Listing price updated successfully!!");
      setOpenSuccess(true);
    } catch (error) {
      console.log(error);
      setError("Only Owner of Marketplace can Update the Listing Price");
      setOpenError(true);
    }
  };

  return (
    <NFTMarketplaceContext.Provider
      value={{
        ConnectToWallet,
        connectWallet,
        uploadToIPFS,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        createSale,
        currentAccount,
        newPrice,
        setNewPrice,
        setCurrentAccount,
        setOpenSuccess,
        openSuccess,
        success,
        setOpenError,
        openError,
        error,
        updateListingPrice,
        truncateString,
      }}
    >
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
