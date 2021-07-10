export const ether = (_amount) => {
  return new web3.utils.BN(web3.utils.toWei(_amount.toString(), "ether"));
};

export const tokens = (_amount) => {
  return new web3.utils.BN(web3.utils.toWei(_amount.toString(), "ether"));
};

export const EVM_REVERT = "VM Exception while processing transaction: revert";

export const ETHER_ADDRESS1 = "0x0000000000000000000000000000000000000000";
