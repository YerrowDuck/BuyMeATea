import abi from '../../utils/BuyMeATea.json';
import { ethers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import React, { useEffect, useState } from "react";
import styles from '@/styles/Home.module.css';
import { ChakraProvider, Box, Text, Input, Textarea, Button, VStack, Center, Divider } from '@chakra-ui/react';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  // Contract Address & ABI
  const contractsAddress = "0xC2F13528B91582E64e18Ea3E0DCDfeFedBd9333F";
  const contractABI = abi.abi;

  // Component State
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  const onNameChange = (event) => {
    setName(event.target.value);
  }

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  }

  // Wallet connection logic
  const isWalletConnected = async () =>  {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({method: 'eth_accounts'});
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0]
        console.log("wallet is connected!" + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  const connectWallet = async () => {

    try {
      const {ethereum} = window;

      if(!ethereum) {
        console.log("Please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  

  // Function for Buying Tea
  const buyTea = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeATea = new ethers.Contract(contractsAddress, contractABI, signer);

        console.log("buying tea...");
        const teaTxn = await buyMeATea.buyTea(
          name ? name : "Anonymous",
          message ? message : "Enjoy your tea!",
          { value: ethers.utils.parseEther("0.001") }
        );

        toast({
          title: "Tea purchase initiated.",
          description: "Your transaction has been sent. Waiting for confirmation.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });

        await teaTxn.wait();

        toast({
          title: "Tea purchased successfully.",
          description: `Transaction hash: ${teaTxn.hash}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        console.log("mined", teaTxn.hash);
        console.log("tea purchased successfully");

        //Clear the form fields
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeATea = new ethers.Contract(contractsAddress, contractABI, signer);

        console.log("fetching memos from the blockchain...");
        const memos = await buyMeATea.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeATea;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name
        }
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeATea = new ethers.Contract(contractsAddress, contractABI, signer);

      buyMeATea.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeATea) {
        buyMeATea.off("NewMemo", onNewMemo);
      }
    };
  }, []);

  return (
    <ChakraProvider>
      <Head>
        <title>Buy Me a Tea!</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box as="main" className={styles.main} textAlign="center" p={4}>
        <Text as="h1" className={styles.title} fontSize="24xl" fontWeight="bold" mb={4}>
          Buy Me a Tea!
        </Text>
        <Box className={styles.description}>
          <Text fontSize="lg" color="gray.600">
            「Buy Me a Tea!」へようこそ！あなたはお茶代と一緒に心のこもったメッセージを送ることができます。あなたのお茶は、あなたが感謝のメッセージを送りたい人々へ直接送られます。
          </Text>
        </Box>

        {currentAccount ? (
          <VStack spacing={4}>
            <Input
              placeholder="Name"
              value={name}
              onChange={onNameChange}
              variant="filled"
            />

            <Textarea
              placeholder="Send Me a Message"
              value={message}
              onChange={onMessageChange}
              rows={3}
              variant="filled"
            />

            <Button colorScheme="teal" onClick={buyTea}>
              Send 1 Tea for 0.001 ETH
            </Button>
          </VStack>
        ) : (
          <Button colorScheme="teal" size="lg" onClick={connectWallet}>
            Connect your wallet
          </Button>
        )}
      </Box>

      {currentAccount && (
        <Box as="section" p={4}>
          <Text as="h1" fontSize="xl" fontWeight="bold" mb={4}>
            Memos received
          </Text>
          {memos.map((memo, idx) => (
            <Box key={idx} bg="gray.200" borderRadius="md" p={4} mb={4}>
              <Text>
                From: {memo.name}
              </Text>
              <Text>
                Message: {memo.message}
              </Text>
              <Text>
                Time: {memo.timestamp.toString()}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box as="footer" textAlign="center" p={4} bg="gray.200">
        <Text fontSize="sm" color="gray.600">
          Created by @0xkumi
        </Text>
      </Box>
    </ChakraProvider>
  )
}
