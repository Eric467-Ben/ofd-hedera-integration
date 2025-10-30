// commit.circom
pragma circom 2.0.0;

/*
  Simple commitment circuit for demo.
  Inputs:
    - private: secret (preimage)
    - public:   commitment = Poseidon(secret)
  Output:
    - verifies that commitment == Poseidon(secret)
*/

include "circomlib/poseidon.circom";

template Commit() {
    // private input
    signal input secret;

    // public input (commitment)
    signal input commitment;

    // compute poseidon(secret)
    component p = Poseidon(1);
    p.inputs[0] <== secret;

    // enforce equality: commitment == poseidon(secret)
    commitment === p.out;
}

component main = Commit();
