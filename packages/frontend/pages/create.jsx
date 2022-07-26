import axios from 'axios';
import { ethers } from 'ethers';
import { Upload } from 'heroicons-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import styled, { css } from 'styled-components';
import {
  StyledFileInput, StyledForm, StyledFormItem, StyledInput, StyledLabel, StyledTextArea,
} from '../components/form/Form';
import { LINKS } from '../components/utils/Navbar';
import Page from '../components/utils/Page';
import useResponsive from '../hooks/useResponsive';
import useWallet, { availableNetworks } from '../hooks/useWallet';
import {
  Button, Size, StyledHeadingOne, StyledText,
} from '../styles/GlobalComponents';
import { uploadPocDataToIPFS } from '../utils/ipfs';
// import pocAbi from '../utils/pocAbi';
import pocBytecode from '../utils/pocBytecode';

const UPLOAD_STATE = {
  unset: 'unset',
  uploadToIPFS: 'uploadToIPFS',
  waitingForMMAction: 'waitingForMMAction',
  success: 'success',
  denied: 'denied',
  txError: 'txError',
  txWaiting: 'txWaiting',
};

const CREATION_STATE = {
  unset: 'unset',
  setImage: 'setImage',
  setDescription: 'setDescription',
  setName: 'setName',
  setCount: 'setCount',
  validation: 'validating',
  deploying: 'deploying',
  success: 'success',
  error: 'error',
  deployingError: 'deployingError',
};

const Create = () => {
  const [pocName, setPocName] = useState('');
  const [pocImage, setPocImage] = useState('');
  const [pocFile, setPocFile] = useState({});
  const [pocDescription, setPocDescription] = useState('');
  const [pocCount, setPocCount] = useState(100);
  const [pocLink, setPocLink] = useState('');

  const [creationState, setCreationState] = useState(CREATION_STATE.setImage);
  const [uploadState, setUploadState] = useState(UPLOAD_STATE.unset);

  const {
    account, isWrongNetwork, currentChainId,
  } = useWallet();
  const { isSmallerThanSm, isSmallerThanMd } = useResponsive();

  const isDataValid = useMemo(() => pocName?.length && pocImage?.length && pocDescription?.length,
    [pocName, pocImage, pocDescription]);

  useEffect(() => {

  }, []);

  const importImage = async (e) => {
    try {
      const img = URL.createObjectURL(e.target.files[0]);

      setPocFile(e.target.files[0]);

      setPocImage(img);
    } catch (err) {
      console.error('Error importing image: ', err);
    }
  };

  /*
  async function getPocContract(ethereumProvider, pocAddress) {
    const provider = new ethers.providers.Web3Provider(ethereumProvider);
    const dnpContract = new ethers.Contract(pocAddress, pocAbi, provider);
    return dnpContract;
  }
  async function createPocContract(ethereumProvider, metadataURI, name, count) {
    const pf = await getPocContract(ethereumProvider);
    const gasLessMinter = '0xE84132Be566a83988501a1eA134DeC5992ea0aaE';
    const hostRinkeby = '0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6';
    const acceptedTokenRinkeby = '0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90';
    const res = await pf.populateTransaction.createPoc(gasLessMinter, name, 'Freedao', metadataURI, hostRinkeby, acceptedTokenRinkeby);
    res.from = account;
    const txHash = await ethereumProvider.request({
      method: 'eth_sendTransaction',
      params: [res],
    });
    return txHash;
  }
  */

  const createPoc = async (e) => {
    e.preventDefault();

    if (!isWrongNetwork) {
      setCreationState(CREATION_STATE.deploying);

      setUploadState(UPLOAD_STATE.uploadToIPFS);

      const brandedName = `Freedao - ${pocName}`;

      const murl = await uploadPocDataToIPFS([pocFile], brandedName, pocDescription);

      if (murl) {
        setUploadState(UPLOAD_STATE.waitingForMMAction);
      } else {
        setUploadState(UPLOAD_STATE.error);
        setCreationState(CREATION_STATE.deployingError);
      }

      try {
        // const res = await createPocContract(window.ethereum, murl, brandedName, pocCount);
        // const txHash = res;

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let host;
        let daix;
        // setUploadState(UPLOAD_STATE.txWaiting);
        availableNetworks.forEach((network) => {
          if (network.chainId === currentChainId) {
            host = network.host;
            daix = network.daix;
          }
        });
        const gasLessMinter = '0xE84132Be566a83988501a1eA134DeC5992ea0aaE';
        // const hostRinkeby = '0xeD5B5b32110c3Ded02a07c8b8e97513FAfb883B6';
        // const acceptedTokenRinkeby = '0x745861AeD1EEe363b4AaA5F1994Be40b1e05Ff90';

        const pocAbi = [
          {
            inputs: [
              {
                internalType: 'address',
                name: '_gasLessMinter',
                type: 'address',
              },
              {
                internalType: 'string',
                name: '_name',
                type: 'string',
              },
              {
                internalType: 'string',
                name: '_symbol',
                type: 'string',
              },
              {
                internalType: 'string',
                name: '_baseURI',
                type: 'string',
              },
              {
                internalType: 'contract ISuperfluid',
                name: 'host',
                type: 'address',
              },
              {
                internalType: 'contract ISuperToken',
                name: 'acceptedToken',
                type: 'address',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'constructor',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'approved',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
              },
            ],
            name: 'Approval',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'operator',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'bool',
                name: 'approved',
                type: 'bool',
              },
            ],
            name: 'ApprovalForAll',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
              },
            ],
            name: 'Transfer',
            type: 'event',
          },
          {
            inputs: [
              {
                internalType: 'contract ISuperToken',
                name: '_superToken',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '_agreementClass',
                type: 'address',
              },
              {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '_ctx',
                type: 'bytes',
              },
            ],
            name: 'afterAgreementCreated',
            outputs: [
              {
                internalType: 'bytes',
                name: 'newCtx',
                type: 'bytes',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'contract ISuperToken',
                name: '_superToken',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '_agreementClass',
                type: 'address',
              },
              {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '_ctx',
                type: 'bytes',
              },
            ],
            name: 'afterAgreementTerminated',
            outputs: [
              {
                internalType: 'bytes',
                name: 'newCtx',
                type: 'bytes',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'contract ISuperToken',
                name: '_superToken',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '_agreementClass',
                type: 'address',
              },
              {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '_ctx',
                type: 'bytes',
              },
            ],
            name: 'afterAgreementUpdated',
            outputs: [
              {
                internalType: 'bytes',
                name: 'newCtx',
                type: 'bytes',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
              },
            ],
            name: 'approve',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
            ],
            name: 'balanceOf',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'contract ISuperToken',
                name: '',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
              {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
            ],
            name: 'beforeAgreementCreated',
            outputs: [
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'contract ISuperToken',
                name: '',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
              {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
            ],
            name: 'beforeAgreementTerminated',
            outputs: [
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'contract ISuperToken',
                name: '',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
              {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
            ],
            name: 'beforeAgreementUpdated',
            outputs: [
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
              },
            ],
            name: 'getApproved',
            outputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'operator',
                type: 'address',
              },
            ],
            name: 'isApprovedForAll',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'name',
            outputs: [
              {
                internalType: 'string',
                name: '',
                type: 'string',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
              },
            ],
            name: 'ownerOf',
            outputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
            ],
            name: 'safeMint',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
              },
            ],
            name: 'safeTransferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
              },
              {
                internalType: 'bytes',
                name: '_data',
                type: 'bytes',
              },
            ],
            name: 'safeTransferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'operator',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'approved',
                type: 'bool',
              },
            ],
            name: 'setApprovalForAll',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'bytes4',
                name: 'interfaceId',
                type: 'bytes4',
              },
            ],
            name: 'supportsInterface',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'symbol',
            outputs: [
              {
                internalType: 'string',
                name: '',
                type: 'string',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
              },
            ],
            name: 'tokenURI',
            outputs: [
              {
                internalType: 'string',
                name: '',
                type: 'string',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
              },
            ],
            name: 'transferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ];
        console.log('host and daix', host, daix);
        const freedao = new ethers.ContractFactory(pocAbi, pocBytecode, provider.getSigner());
        const pocContract = await freedao.deploy(gasLessMinter, brandedName, 'Freedao', murl, host, daix);
        console.log('good?', pocContract.address);
        const pocAddress = pocContract.address;

        // const tx = await (await provider.getTransaction(txHash)).wait();

        // const pocAddress = await getPocWithEventAndCreator(window.ethereum, brandedName);

        if (pocContract.address) {
          setUploadState(UPLOAD_STATE.success);

          setPocLink(`${process.env.FRONTEND_URL}${LINKS.redeem}?freedao=${pocAddress}`);

          const payload = {
            chainId: currentChainId,
            userAddress: account,
            pocAddress,
          };

          await axios.post(`${process.env.SERVER_URL}/v1/server/savePoc`, payload).catch((err) => {
            throw new Error('Failed to save freedao in DB :', err);
          });
        } else {
          setUploadState(UPLOAD_STATE.txError);
          setCreationState(CREATION_STATE.deployingError);
        }

        setUploadState(UPLOAD_STATE.success);
      } catch (err) {
        console.error('Error creating Freedao: ', err);
        setUploadState(UPLOAD_STATE.denied);
        setCreationState(CREATION_STATE.deployingError);
      }
    }
  };

  const previousCreationState = () => {
    switch (creationState) {
      case CREATION_STATE.setDescription:
        setCreationState(CREATION_STATE.setName);
        break;
      case CREATION_STATE.setName:
        setCreationState(CREATION_STATE.setImage);
        break;
      case CREATION_STATE.setCount:
        setCreationState(CREATION_STATE.setDescription);
        break;
      case CREATION_STATE.validation:
        setCreationState(CREATION_STATE.setCount);
        break;
      case CREATION_STATE.deployingError:
        setCreationState(CREATION_STATE.setCount);
        break;
      default:
        break;
    }
  };

  const downloadQrCode = (e) => {
    e.preventDefault();

    // download svg file with id to-pdf-item
    const svg = document.getElementById('to-pdf-item');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    img.setAttribute('src', `data:image/svg+xml;base64,${btoa(svgData)}`);
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const canvasdata = canvas.toDataURL('image/png');
      const png = document.createElement('a');
      png.download = `Freedao-${pocName}.png`;
      png.href = canvasdata;
      png.click();
    };
  };

  const nextCreationState = () => {
    switch (creationState) {
      case CREATION_STATE.setImage:
        setCreationState(CREATION_STATE.setName);
        break;
      case CREATION_STATE.setName:
        setCreationState(CREATION_STATE.setDescription);
        break;
      case CREATION_STATE.setDescription:
        setCreationState(CREATION_STATE.setCount);
        break;
      case CREATION_STATE.setCount:
        setCreationState(CREATION_STATE.validation);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Page title="Create Freedao">
        <StyledContainer>
          <StyledHeadingOne>
            Engage your community with a new Freedao
          </StyledHeadingOne>

          <StyledFormContainer>
            <StyledForm>
              <StyledFormItem
                isVisible={creationState === CREATION_STATE.setImage}
              >
                <StyledLabel>
                  Select an Image
                </StyledLabel>

                <StyledImgContainer
                  isVisible={pocImage?.length}
                >
                  <StyledPocImage
                    src={pocImage}
                  />
                </StyledImgContainer>

                {creationState === CREATION_STATE.setImage && (
                <StyledFileInput
                  for="input-file"
                  secondary
                >
                  {pocImage.length === 0 ? 'Upload Image' : 'Update Image'}

                  <Upload size={20} />

                  <input id="input-file" type="file" accept="image/*" onChange={importImage} />
                </StyledFileInput>
                )}
              </StyledFormItem>

              <StyledFormItem isVisible={creationState === CREATION_STATE.setCount}>
                <StyledLabel>
                  How many Freedao do you want to create?
                </StyledLabel>
                <StyledInput
                  type="number"
                  formNoValidate
                  step="20"
                  min="1"
                  max="10000"
                  placeholder="100"
                  value={pocCount}
                  onChange={(e) => setPocCount(e.target.value)}
                />
              </StyledFormItem>

              <StyledFormItem isVisible={creationState === CREATION_STATE.setName}>
                <StyledLabel>
                  Name your Freedao
                </StyledLabel>
                <StyledInput
                  type="text"
                  placeholder="Name"
                  value={pocName}
                  onChange={(e) => setPocName(e.target.value)}
                />
              </StyledFormItem>

              <StyledFormItem isVisible={creationState === CREATION_STATE.setDescription}>
                <StyledLabel>
                  Add a short description
                </StyledLabel>
                <StyledTextArea
                  placeholder="My Freedao is..."
                  value={pocDescription}
                  onChange={(e) => setPocDescription(e.target.value)}
                />
              </StyledFormItem>

              <StyledFormItem isVisible={uploadState === UPLOAD_STATE.success} style={!isSmallerThanMd ? { top: '30%' } : {}}>
                <StyledLabel style={{ textAlign: 'center' }}>
                  Scan this QR Code to claim this Freedao
                </StyledLabel>
                <QrCodeContainer>
                  <QRCode
                    id="to-pdf-item"
                    size={isSmallerThanSm ? 150 : 200}
                    value={pocLink}
                  />
                </QrCodeContainer>
                <QrCodeContainer style={{ flexDirection: 'row' }}>
                  <Button
                    onClick={(e) => downloadQrCode(e)}
                    style={{ marginTop: '60px', marginRight: '16px' }}
                    secondary
                    size={Size.s}
                    disabled={uploadState !== UPLOAD_STATE.success}
                  >
                    Download QR Code
                  </Button>
                  <Link href={LINKS.collections}>
                    <Button
                      style={{ marginTop: '60px' }}
                      size={Size.s}
                    >
                      See My Collection
                    </Button>
                  </Link>
                </QrCodeContainer>
              </StyledFormItem>

              <StyledText
                isVisible={creationState === CREATION_STATE.deploying || creationState === CREATION_STATE.deployingError}
                negative={uploadState === UPLOAD_STATE.denied || uploadState === UPLOAD_STATE.txError}
                positive={uploadState === UPLOAD_STATE.success}
                size={Size.l}
              >
                {uploadState === UPLOAD_STATE.uploadToIPFS && 'Uploading to IPFS...'}
                {uploadState === UPLOAD_STATE.waitingForMMAction && 'Waiting for User Wallet Action...'}
                {uploadState === UPLOAD_STATE.denied && 'Wallet Action Denied'}
                {uploadState === UPLOAD_STATE.txError && 'Transaction Error'}
                {uploadState === UPLOAD_STATE.txWaiting && (
                  <>
                    <span>
                      Waiting for Transaction to be mined
                    </span>
                    <br />
                    <span style={{
                      fontStyle: 'italic', marginTop: '8px', textAlign: 'right', opacity: '0.5',
                    }}
                    >
                      Please do not refresh the page or close the browser
                    </span>
                  </>
                )}
              </StyledText>

              <StyledFormItem isVisible={creationState === CREATION_STATE.validation}>
                <StyledLabel>
                  Are you ready to create your Freedao ?
                </StyledLabel>

                <Button
                  style={{ width: '100%' }}
                  type="submit"
                  onClick={(e) => createPoc(e)}
                  disabled={!isDataValid || creationState !== CREATION_STATE.validation}
                  id="submit-freedao"
                >
                  {isWrongNetwork ? 'Wrong Network' : 'Save and Continue'}
                </Button>
              </StyledFormItem>

            </StyledForm>

            {uploadState === UPLOAD_STATE.success ? (
              <></>
            ) : creationState === CREATION_STATE.deployingError ? (
              <ArrowContainer>
                <Button
                  onClick={(e) => createPoc(e)}
                >
                  Try again
                </Button>

                <Button
                  onClick={() => previousCreationState()}
                  style={{ marginTop: '12px' }}
                  disabled={creationState === CREATION_STATE.deploying || creationState === CREATION_STATE.setImage}
                  tertiary
                  isVisible={creationState === CREATION_STATE.setImage}
                >
                  Go Back
                </Button>

              </ArrowContainer>
            ) : (
              <ArrowContainer>
                <Button
                  onClick={() => nextCreationState()}
                  disabled={creationState === CREATION_STATE.deploying || creationState === CREATION_STATE.validation || creationState === CREATION_STATE.deployingError}
                  hidden={creationState === CREATION_STATE.validation}
                >
                  {creationState === CREATION_STATE.setImage ? 'Choose a Name'
                    : creationState === CREATION_STATE.setName ? 'Create a small description'
                      : creationState === CREATION_STATE.setDescription ? 'Select Count of Freedao'
                        : creationState === CREATION_STATE.setCount ? 'Ready ?'
                          : creationState === CREATION_STATE.validation ? 'Start Factory'
                            : 'Deploying...'}
                </Button>
                <Button
                  onClick={() => previousCreationState()}
                  style={{ marginTop: '12px' }}
                  disabled={creationState === CREATION_STATE.deploying || creationState === CREATION_STATE.setImage}
                  tertiary
                  isVisible={creationState === CREATION_STATE.setImage}
                >
                  Go Back
                </Button>
              </ArrowContainer>
            )}

          </StyledFormContainer>
        </StyledContainer>
      </Page>
    </>
  );
};

const QrCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 32px;
  width: 100%;
`;

const StyledFormContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  flex-direction: column;
`;

const ArrowContainer = styled.div`
  margin-top: 84px;
  display: flex;
  justify-content: center;
  align-items: center;

  flex-direction: column;
`;

const StyledImgContainer = styled.div`
    transition: all 0.4s ease-in-out;

    overflow: hidden;

    ${(props) => (props.isVisible ? css`
        max-height: 120px;
        opacity: 1.0;
    ` : css`
        max-height: 0px;
        opacity: 0;
    `)}
`;

const StyledPocImage = styled.img`
    width: 120px;
    height: 120px;
    object-fit: cover;

    border-radius: 50%;
`;

const StyledContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    min-height: 100vh;

    z-index: 2;

    padding-top: ${({ theme }) => theme.spacing['5xl']};

    @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
        padding-top: ${({ theme }) => theme.spacing['3xl']};
    }
`;

export default Create;
