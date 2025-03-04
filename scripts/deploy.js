async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Get the contract factory and deploy the contract
    const MedicalRecordAudit = await ethers.getContractFactory("MedicalRecordAudit");
    const medicalRecordAudit = await MedicalRecordAudit.deploy();
    console.log("MedicalRecordAudit deployed to:", medicalRecordAudit.address);
}

// Run the main function
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
