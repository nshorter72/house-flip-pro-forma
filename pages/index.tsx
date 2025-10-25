import React from 'react';
import Head from 'next/head';
import HouseFlipProForma from '../components/HouseFlipProForma';

const HomePage = () => {
  return (
    <>
      <Head>
        <title>House Flip Pro Forma</title>
        <meta name="description" content="Enhanced House Flip Pro Forma" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <HouseFlipProForma />
    </>
  );
};

export default HomePage;
