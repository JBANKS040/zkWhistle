// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/contracts/Whistleblower.sol";
import "../src/contracts/Verifier.sol";

contract WhistleblowerTest is Test {
    Whistleblower public whistleblower;
    Groth16Verifier public verifier;
    address public owner;

    function setUp() public {
        owner = address(this);
        verifier = new Groth16Verifier();
        whistleblower = new Whistleblower(address(verifier));
        // Enable test mode
        whistleblower.setTestMode(true);
    }

    function testSubmitReport() public view {
        console.log("Testing proof verification...");
        
        uint256[2] memory pA = [
            10582106661612570115408932009581843904905928612191115711584413783801831414640,
            12516690183647992486187305455737624196732910373077527534067597843360136528972
        ];
        
        // Note: pB coordinates are swapped within each pair for BN254 pairing
        uint256[2][2] memory pB = [
            [
                7696761440786768828167413376927861680069372476449242333726000558295435217343,
                18298781455951200113856848571003238795721121323729412521500080481354442517389
            ],
            [
                4937393996666013269974740657547117366790926735828387846060915867451941550594,
                12785575794719524479487277124682616675363344280794198324011976203012712072933
            ]
        ];
        
        uint256[2] memory pC = [
            5585172081238175074557097542602366267342947780708849454048446628920384549668,
            14972281817933750109187938088771247572318518916811910495436343157033558379647
        ];

        uint256[2] memory pubSignals = [
            9668210347660026577825042813869197284891181264135147385290831791107915505446,
            1736968047
        ];

        bool isValid = verifier.verifyProof(pA, pB, pC, pubSignals);
        console.log("Proof verification result:", isValid);
        require(isValid, "Proof verification failed");
    }

    function testSubmitReportWithIPFS() public {
        // Similar to testSubmitReport but with IPFS data
        // ... implement this test after basic submitReport works
    }
}
