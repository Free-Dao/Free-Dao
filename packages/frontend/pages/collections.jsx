import axios from 'axios';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import PocItem from '../components/gallery/PocItem';
import Page from '../components/utils/Page';
import useWallet, { availableNetworks } from '../hooks/useWallet';
import { StyledHeadingOne } from '../styles/GlobalComponents';
import pocFactoryAbi from '../utils/pocFactoryAbi';
import { getPocContract } from './claim';

const Gallery = () => {
  const [userPocs, setUserPocs] = useState([{ id: 'uehf43' }, { id: 'uehf44' }, { id: 'uehf45' }]);
  const { account, isWrongNetwork, currentChainId } = useWallet();

  async function getAllPocsAddressFromUser(ethereumProvider) {
    const payload = { userAddr: account };
    const res = await axios.post(`${process.env.SERVER_URL}/v1/server/getAllPocsCreatedByUser`, payload);
    console.log(res.data);
    const pocsAddresses = [];
    res.data.forEach((element) => {
      pocsAddresses.push(element.poc_address);
    });
    return pocsAddresses;

    /*
    const pocFactoryContract = await getPocFactoryContract(ethereumProvider);
    const index = await pocFactoryContract.getLastPocCreatorIndex(account);
    const intIndex = parseInt(index, 16);
    const pocsAddresses = [];

    console.log('index', index.toString());
    console.log('intIndex', intIndex);

    for (let i = 1; i < intIndex - 1; i++) {
      // eslint-disable-next-line no-await-in-loop
      const pocAddress = await pocFactoryContract.getPocWithCreatorIndex(account, intIndex - 1);
      pocsAddresses.push(pocAddress);
    }
    return pocsAddresses;
    */
  }

  const getPocMetadata = async (pocAddress) => {
    const pocContract = await getPocContract(window.ethereum, pocAddress);
    const data = await pocContract.tokenURI(4);
    axios.get(data).then((res) => {
      let imageLinkIpfs = res.data.image;
      imageLinkIpfs = imageLinkIpfs.replace('ipfs://', 'https://ipfs.io/ipfs/');
      // TODO : use this data
      /*
        name: res.data.name,
        description: res.data.description,
        src: imageLinkIpfs,
      */
    });
  };

  const fetchPocForAccount = async (a) => {
    try {
      const addresses = await getAllPocsAddressFromUser(window.ethereum);

      console.log('addresses', addresses);

      const promisesContracts = addresses.map((add) => getPocContract(window.ethereum, add));

      const resolvedContracts = await Promise.all(promisesContracts);

      const promisesMetadata = resolvedContracts.map((c) => c.tokenURI(4));

      const resolvedMetadata = await Promise.all(promisesMetadata);

      const promisesData = resolvedMetadata.map((m) => axios.get(m));

      const resolvedData = await Promise.all(promisesData);

      const datas = resolvedData.map((d) => {
        let imageLinkIpfs = d.data.image;
        imageLinkIpfs = imageLinkIpfs.replace('ipfs://', 'https://ipfs.io/ipfs/');
        return ({
          name: d.data.name,
          description: d.data.description,
          src: imageLinkIpfs,
        });
      });

      console.log('datas', datas);

      setUserPocs(datas);
    } catch (err) {
      console.error('Error fetching freedao for account: ', err);
    }
  };

  useEffect(() => {
    if (account) {
      fetchPocForAccount(account);
    }
  }, [account]);

  useEffect(() => {

  }, []);

  return (
    <Page title="My Gallery">
      <StyledContainer>
        <StyledHeadingOne>
          My Collections
        </StyledHeadingOne>

        <StyledPocList>
          {userPocs.map((p) => (
            <PocItem key={p.name + p.src + p.id} freedao={p} />
          ))}
        </StyledPocList>

      </StyledContainer>
    </Page>
  );
};

const StyledPocList = styled.ul`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;

    list-style: none;

    width: 100%;

    padding: 0;
`;

const StyledContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    z-index: 2;

    min-height: 100vh;
    
    padding-top: ${({ theme }) => theme.spacing['5xl']};

    @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
        padding-top: ${({ theme }) => theme.spacing['3xl']};
    }
`;

export default Gallery;
