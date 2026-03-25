// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SeismicCrystalRobotNFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    uint8 public constant ROBOT_MODELS = 50;
    uint64 public constant CHECKIN_COOLDOWN = 1 days;

    uint8 public constant CRYSTAL_RARE = 1;
    uint8 public constant CRYSTAL_EPIC = 2;
    uint8 public constant CRYSTAL_LEGENDARY = 3;

    uint8 public constant RARE_TO_MINT = 5;
    uint8 public constant EPIC_TO_MINT = 2;
    uint8 public constant LEGENDARY_TO_MINT = 1;

    uint256 public checkInFeeWei;
    uint256 public nextTokenId;
    address public feeReceiver;

    string public nftImageURI;

    struct CrystalWallet {
        uint32 rare;
        uint32 epic;
        uint32 legendary;
    }

    struct RobotMeta {
        uint8 robotModel; // 1..50
        uint8 sourceCrystal; // 1 Rare, 2 Epic, 3 Legendary
        uint8 magnitude; // 1..10
        uint64 mintedAt;
    }

    mapping(address => uint64) public lastCheckInAt;
    mapping(address => uint32) public boxBalance;
    mapping(address => CrystalWallet) private _crystals;
    mapping(uint256 => RobotMeta) public robotMeta;

    event CheckIn(address indexed user, uint256 feePaid, uint64 nextCheckInAt, uint32 boxBalance);
    event BoxOpened(
        address indexed user,
        uint8 crystalRarity,
        uint32 rareBalance,
        uint32 epicBalance,
        uint32 legendaryBalance
    );
    event RobotMinted(address indexed user, uint256 indexed tokenId, uint8 robotModel, uint8 sourceCrystal, uint8 magnitude);
    event CheckInFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);
    event NftImageURIUpdated(string oldURI, string newURI);

    error ZeroAddress();
    error CheckInCooldown(uint64 nextAllowedAt);
    error InsufficientFee();
    error NoBoxesAvailable();
    error NotEnoughCrystals(uint8 crystalType, uint32 current, uint8 required);
    error FeeTransferFailed();

    constructor(address owner_, address feeReceiver_, uint256 checkInFeeWei_, string memory nftImageURI_)
        ERC721("Seismic Robot", "SROBOT")
        Ownable(owner_)
    {
        if (feeReceiver_ == address(0)) revert ZeroAddress();

        feeReceiver = feeReceiver_;
        checkInFeeWei = checkInFeeWei_;
        nftImageURI = nftImageURI_;
    }

    function checkIn() external payable {
        uint64 nowTs = uint64(block.timestamp);
        uint64 last = lastCheckInAt[msg.sender];

        if (last != 0 && nowTs < last + CHECKIN_COOLDOWN) {
            revert CheckInCooldown(last + CHECKIN_COOLDOWN);
        }
        if (msg.value < checkInFeeWei) revert InsufficientFee();

        lastCheckInAt[msg.sender] = nowTs;
        boxBalance[msg.sender] += 1;

        (bool ok,) = feeReceiver.call{value: msg.value}("");
        if (!ok) revert FeeTransferFailed();

        emit CheckIn(msg.sender, msg.value, nowTs + CHECKIN_COOLDOWN, boxBalance[msg.sender]);
    }

    function openBox() external returns (uint8 crystalRarity) {
        uint32 boxes = boxBalance[msg.sender];
        if (boxes == 0) revert NoBoxesAvailable();

        boxBalance[msg.sender] = boxes - 1;

        uint256 seed = _seed(msg.sender, nextTokenId + 1);
        crystalRarity = _rollCrystalRarity(seed);

        CrystalWallet storage w = _crystals[msg.sender];
        if (crystalRarity == CRYSTAL_RARE) {
            w.rare += 1;
        } else if (crystalRarity == CRYSTAL_EPIC) {
            w.epic += 1;
        } else {
            w.legendary += 1;
        }

        emit BoxOpened(msg.sender, crystalRarity, w.rare, w.epic, w.legendary);
    }

    function mintRobotWithRare() external returns (uint256 tokenId) {
        tokenId = _mintRobot(msg.sender, CRYSTAL_RARE, RARE_TO_MINT);
    }

    function mintRobotWithEpic() external returns (uint256 tokenId) {
        tokenId = _mintRobot(msg.sender, CRYSTAL_EPIC, EPIC_TO_MINT);
    }

    function mintRobotWithLegendary() external returns (uint256 tokenId) {
        tokenId = _mintRobot(msg.sender, CRYSTAL_LEGENDARY, LEGENDARY_TO_MINT);
    }

    function getUserStatus(address user)
        external
        view
        returns (uint32 boxes, uint64 lastCheckIn, uint64 nextCheckIn, bool canCheckIn)
    {
        boxes = boxBalance[user];
        lastCheckIn = lastCheckInAt[user];

        if (lastCheckIn == 0) {
            nextCheckIn = uint64(block.timestamp);
            canCheckIn = true;
        } else {
            nextCheckIn = lastCheckIn + CHECKIN_COOLDOWN;
            canCheckIn = uint64(block.timestamp) >= nextCheckIn;
        }
    }

    function getCrystalBalances(address user) external view returns (uint32 rare, uint32 epic, uint32 legendary) {
        CrystalWallet memory w = _crystals[user];
        return (w.rare, w.epic, w.legendary);
    }

    function crystalName(uint8 crystalType) public pure returns (string memory) {
        if (crystalType == CRYSTAL_RARE) return "Rare";
        if (crystalType == CRYSTAL_EPIC) return "Epic";
        if (crystalType == CRYSTAL_LEGENDARY) return "Legendary";
        return "Unknown";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        RobotMeta memory m = robotMeta[tokenId];
        string memory crystal = crystalName(m.sourceCrystal);

        string memory image = bytes(nftImageURI).length > 0
            ? nftImageURI
            : _buildFallbackImage(tokenId, m.robotModel, crystal, m.magnitude);

        string memory json = string(
            abi.encodePacked(
                '{"name":"Seismic Robot #',
                tokenId.toString(),
                '","description":"Minted from daily crystal boxes on Seismic Testnet.","image":"',
                image,
                '","attributes":[{"trait_type":"Robot Model","value":',
                uint256(m.robotModel).toString(),
                '},{"trait_type":"Source Crystal","value":"',
                crystal,
                '"},{"trait_type":"Magnitude","value":',
                uint256(m.magnitude).toString(),
                '},{"display_type":"number","trait_type":"Minted At (Unix)","value":',
                uint256(m.mintedAt).toString(),
                "}]}"
            )
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function setCheckInFeeWei(uint256 newFee) external onlyOwner {
        uint256 old = checkInFeeWei;
        checkInFeeWei = newFee;
        emit CheckInFeeUpdated(old, newFee);
    }

    function setFeeReceiver(address newReceiver) external onlyOwner {
        if (newReceiver == address(0)) revert ZeroAddress();
        address old = feeReceiver;
        feeReceiver = newReceiver;
        emit FeeReceiverUpdated(old, newReceiver);
    }

    function setNftImageURI(string calldata newURI) external onlyOwner {
        string memory old = nftImageURI;
        nftImageURI = newURI;
        emit NftImageURIUpdated(old, newURI);
    }

    function _mintRobot(address user, uint8 crystalType, uint8 requiredAmount) internal returns (uint256 tokenId) {
        CrystalWallet storage w = _crystals[user];
        uint32 current = _crystalBalanceRef(w, crystalType);
        if (current < requiredAmount) {
            revert NotEnoughCrystals(crystalType, current, requiredAmount);
        }

        _decreaseCrystal(w, crystalType, requiredAmount);

        tokenId = ++nextTokenId;
        uint256 seed = _seed(user, tokenId);

        uint8 robotModel = uint8(((seed >> 24) % ROBOT_MODELS) + 1);
        uint8 magnitude = _rollMagnitude(seed >> 48, crystalType);

        robotMeta[tokenId] = RobotMeta({
            robotModel: robotModel,
            sourceCrystal: crystalType,
            magnitude: magnitude,
            mintedAt: uint64(block.timestamp)
        });

        _safeMint(user, tokenId);
        emit RobotMinted(user, tokenId, robotModel, crystalType, magnitude);
    }

    function _seed(address user, uint256 tokenId) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, user, tokenId, blockhash(block.number - 1))));
    }

    // Not cryptographically secure randomness, enough for testnet game flow.
    function _rollCrystalRarity(uint256 seedValue) internal pure returns (uint8) {
        uint256 roll = seedValue % 1000;
        if (roll < 720) return CRYSTAL_RARE; // 72%
        if (roll < 950) return CRYSTAL_EPIC; // 23%
        return CRYSTAL_LEGENDARY; // 5%
    }

    function _rollMagnitude(uint256 seedValue, uint8 crystalType) internal pure returns (uint8) {
        uint8 roll = uint8(seedValue % 100);
        if (crystalType == CRYSTAL_RARE) return 3 + (roll % 5); // 3..7
        if (crystalType == CRYSTAL_EPIC) return 6 + (roll % 4); // 6..9
        return 8 + (roll % 3); // 8..10
    }

    function _crystalBalanceRef(CrystalWallet storage w, uint8 crystalType) internal view returns (uint32) {
        if (crystalType == CRYSTAL_RARE) return w.rare;
        if (crystalType == CRYSTAL_EPIC) return w.epic;
        return w.legendary;
    }

    function _decreaseCrystal(CrystalWallet storage w, uint8 crystalType, uint8 amount) internal {
        if (crystalType == CRYSTAL_RARE) {
            w.rare -= amount;
            return;
        }
        if (crystalType == CRYSTAL_EPIC) {
            w.epic -= amount;
            return;
        }
        w.legendary -= amount;
    }

    function _buildFallbackImage(uint256 tokenId, uint8 model, string memory crystal, uint8 magnitude)
        internal
        pure
        returns (string memory)
    {
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">',
                '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1a2f4d"/><stop offset="1" stop-color="#091423"/></linearGradient></defs>',
                '<rect width="100%" height="100%" fill="url(#g)"/>',
                '<text x="360" y="90" text-anchor="middle" fill="#e8f7ff" font-size="46" font-family="monospace">SEISMIC ROBOT</text>',
                '<text x="360" y="280" text-anchor="middle" fill="#b9dbff" font-size="34" font-family="monospace">MODEL #',
                uint256(model).toString(),
                '</text>',
                '<text x="360" y="350" text-anchor="middle" fill="#d8fbef" font-size="30" font-family="monospace">SOURCE ',
                crystal,
                '</text>',
                '<text x="360" y="420" text-anchor="middle" fill="#ffd479" font-size="30" font-family="monospace">MAGNITUDE ',
                uint256(magnitude).toString(),
                '</text>',
                '<text x="360" y="660" text-anchor="middle" fill="#7aa9d4" font-size="20" font-family="monospace">TOKEN #',
                tokenId.toString(),
                '</text></svg>'
            )
        );

        return string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(svg)));
    }
}
