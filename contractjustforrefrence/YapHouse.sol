// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract YapToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    address public immutable minter;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, address _minter) {
        require(_minter != address(0), "InvalidMinter");
        name = _name;
        symbol = _symbol;
        minter = _minter;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "AllowanceExceeded");
        unchecked {
            allowance[from][msg.sender] = currentAllowance - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "NotMinter");
        require(to != address(0), "InvalidRecipient");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "InvalidRecipient");
        uint256 balance = balanceOf[from];
        require(balance >= amount, "InsufficientBalance");
        unchecked {
            balanceOf[from] = balance - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}

contract YapHouse {
    struct UserProfile {
        address wallet;
        string email;
        string name;
        uint64 createdRooms;
        uint64 joinedRooms;
        uint64 nextRoomId;
        uint64 lastActiveAt;
        address token;
        bool exists;
    }

    struct Room {
        uint64 roomId;
        address owner;
        string title;
        string description;
        string category;
        uint64 createdAt;
        uint64 scheduledStart;
        uint64 scheduledEnd;
        uint64 startedAt;
        uint64 endedAt;
        uint32 participantCount;
        uint32 rewardCount;
        bool active;
        bool exists;
    }

    struct JoinState {
        uint64 totalDuration;
        uint64 lastJoinedAt;
        bool isActive;
        bool hasJoined;
    }

    uint64 public constant MIN_ATTENDANCE_SECONDS = 30 minutes;
    uint256 public constant MAX_PARTICIPANTS = 500;
    uint256 public constant MAX_WINNERS = 100;

    mapping(address => UserProfile) private _profiles;
    mapping(address => mapping(uint64 => Room)) private _rooms;
    mapping(address => mapping(uint64 => mapping(address => JoinState))) private _joinState;
    mapping(address => mapping(uint64 => address[])) private _roomParticipants;

    event UserRegistered(address indexed user, string email, string name);
    event UserUpdated(address indexed user, string email, string name);
    event RoomCreated(address indexed creator, uint64 indexed roomId, string title);
    event RoomStarted(address indexed creator, uint64 indexed roomId, uint64 startedAt);
    event RoomJoined(address indexed creator, uint64 indexed roomId, address indexed listener);
    event RoomLeft(address indexed creator, uint64 indexed roomId, address indexed listener, uint64 totalDuration);
    event RoomEnded(address indexed creator, uint64 indexed roomId, uint64 endedAt);
    event RewardsPaid(address indexed creator, uint64 indexed roomId, address indexed listener, uint256 amount, uint64 totalDuration);
    event CreatorTokenCreated(address indexed creator, address tokenAddress, string name, string symbol);

    error ProfileNotFound();
    error ProfileAlreadyExists();
    error RoomNotFound();
    error RoomInactive();
    error RoomActive();
    error RoomNotStarted();
    error RoomAlreadyClosed();
    error AlreadyJoined();
    error NotJoined();
    error ParticipantLimit();
    error WinnerLimit();
    error ScheduleInvalid();
    error DurationInsufficient();
    error RoomIdOverflow();
    error RoomCountOverflow();
    error JoinCountOverflow();
    error DurationOverflow();
    error RewardOverflow();
    error LengthMismatch();
    error TimestampError();
    error TokenAlreadyExists();
    error TokenNotConfigured();

    function registerUser(string calldata email, string calldata name) external {
        UserProfile storage profile = _profiles[msg.sender];
        if (profile.exists) revert ProfileAlreadyExists();
        uint64 currentTime = _now();
        profile.wallet = msg.sender;
        profile.email = email;
        profile.name = name;
        profile.createdRooms = 0;
        profile.joinedRooms = 0;
        profile.nextRoomId = 0;
        profile.lastActiveAt = currentTime;
        profile.token = address(0);
        profile.exists = true;
        emit UserRegistered(msg.sender, email, name);
    }

    function updateUser(string calldata email, string calldata name) external {
        UserProfile storage profile = _profiles[msg.sender];
        if (!profile.exists) revert ProfileNotFound();
        uint64 currentTime = _now();
        profile.email = email;
        profile.name = name;
        profile.lastActiveAt = currentTime;
        emit UserUpdated(msg.sender, email, name);
    }

    function createCreatorToken(string calldata tokenName, string calldata tokenSymbol)
        external
        returns (address tokenAddress)
    {
        UserProfile storage profile = _profiles[msg.sender];
        if (!profile.exists) revert ProfileNotFound();
        if (profile.token != address(0)) revert TokenAlreadyExists();

        YapToken newToken = new YapToken(tokenName, tokenSymbol, address(this));
        tokenAddress = address(newToken);
        uint64 currentTime = _now();
        profile.token = tokenAddress;
        profile.lastActiveAt = currentTime;

        emit CreatorTokenCreated(msg.sender, tokenAddress, tokenName, tokenSymbol);
    }

    function createRoom(
        string calldata title,
        string calldata description,
        string calldata category,
        uint64 scheduledStart,
        uint64 scheduledEnd
    ) external returns (uint64 roomId) {
        UserProfile storage profile = _profiles[msg.sender];
        if (!profile.exists) revert ProfileNotFound();
        if (scheduledEnd <= scheduledStart) revert ScheduleInvalid();
        if (profile.nextRoomId == type(uint64).max) revert RoomIdOverflow();
        if (profile.createdRooms == type(uint64).max) revert RoomCountOverflow();

        roomId = profile.nextRoomId;
        profile.nextRoomId = roomId + 1;
        profile.createdRooms += 1;
        uint64 currentTime = _now();
        profile.lastActiveAt = currentTime;

        Room storage room = _rooms[msg.sender][roomId];
        room.roomId = roomId;
        room.owner = msg.sender;
        room.title = title;
        room.description = description;
        room.category = category;
        room.createdAt = currentTime;
        room.scheduledStart = scheduledStart;
        room.scheduledEnd = scheduledEnd;
        room.startedAt = 0;
        room.endedAt = 0;
        room.participantCount = 0;
        room.rewardCount = 0;
        room.active = false;
        room.exists = true;

        emit RoomCreated(msg.sender, roomId, title);
    }

    function startRoom(uint64 roomId) external {
        Room storage room = _rooms[msg.sender][roomId];
        if (!room.exists) revert RoomNotFound();
        if (room.active) revert RoomActive();
        if (room.endedAt != 0) revert RoomAlreadyClosed();
        UserProfile storage profile = _profiles[msg.sender];
        if (!profile.exists) revert ProfileNotFound();

        uint64 currentTime = _now();
        room.active = true;
        room.startedAt = currentTime;
        profile.lastActiveAt = currentTime;

        emit RoomStarted(msg.sender, roomId, currentTime);
    }

    function joinRoom(address creator, uint64 roomId) external {
        Room storage room = _rooms[creator][roomId];
        if (!room.exists) revert RoomNotFound();
        if (!room.active) revert RoomInactive();

        UserProfile storage listenerProfile = _profiles[msg.sender];
        if (!listenerProfile.exists) revert ProfileNotFound();

        JoinState storage join = _joinState[creator][roomId][msg.sender];
        if (join.isActive) revert AlreadyJoined();

        uint64 currentTime = _now();
        if (!join.hasJoined) {
            if (listenerProfile.joinedRooms == type(uint64).max) revert JoinCountOverflow();
            address[] storage participants = _roomParticipants[creator][roomId];
            if (participants.length >= MAX_PARTICIPANTS) revert ParticipantLimit();
            participants.push(msg.sender);
            join.hasJoined = true;
            room.participantCount += 1;
            listenerProfile.joinedRooms += 1;
        }

        join.isActive = true;
        join.lastJoinedAt = currentTime;
        listenerProfile.lastActiveAt = currentTime;

        emit RoomJoined(creator, roomId, msg.sender);
    }

    function leaveRoom(address creator, uint64 roomId) external {
        Room storage room = _rooms[creator][roomId];
        if (!room.exists) revert RoomNotFound();

        JoinState storage join = _joinState[creator][roomId][msg.sender];
        if (!join.isActive) revert NotJoined();

        uint64 currentTime = _now();
        if (currentTime < join.lastJoinedAt) revert TimestampError();
        uint64 delta = currentTime - join.lastJoinedAt;
        if (delta > 0 && join.totalDuration > type(uint64).max - delta) revert DurationOverflow();

        join.totalDuration += delta;
        join.isActive = false;
        join.lastJoinedAt = 0;

        _profiles[msg.sender].lastActiveAt = currentTime;

        emit RoomLeft(creator, roomId, msg.sender, join.totalDuration);
    }

    function endRoom(
        uint64 roomId,
        address[] calldata winners,
        uint256[] calldata rewardAmounts
    ) external {
        Room storage room = _rooms[msg.sender][roomId];
        if (!room.exists) revert RoomNotFound();
        if (!room.active) revert RoomInactive();
        if (room.startedAt == 0) revert RoomNotStarted();
        if (winners.length != rewardAmounts.length) revert LengthMismatch();
        if (winners.length > MAX_WINNERS) revert WinnerLimit();
        if (room.rewardCount > type(uint32).max - winners.length) revert RewardOverflow();

        UserProfile storage profile = _profiles[msg.sender];
        if (!profile.exists) revert ProfileNotFound();
        address tokenAddress = profile.token;
        if (tokenAddress == address(0)) revert TokenNotConfigured();

        uint64 currentTime = _now();
        room.active = false;
        room.endedAt = currentTime;

        {
            address[] storage participants = _roomParticipants[msg.sender][roomId];
            uint256 len = participants.length;
            for (uint256 i = 0; i < len; i++) {
                address participant = participants[i];
                JoinState storage join = _joinState[msg.sender][roomId][participant];
                if (join.isActive) {
                    if (currentTime < join.lastJoinedAt) revert TimestampError();
                    uint64 delta = currentTime - join.lastJoinedAt;
                    if (delta > 0 && join.totalDuration > type(uint64).max - delta) revert DurationOverflow();
                    join.totalDuration += delta;
                    join.isActive = false;
                    join.lastJoinedAt = 0;
                }
            }
        }

        profile.lastActiveAt = currentTime;
        room.rewardCount = room.rewardCount + uint32(winners.length);

        for (uint256 i = 0; i < winners.length; i++) {
            address winner = winners[i];
            JoinState storage joinRecord = _joinState[msg.sender][roomId][winner];
            if (!joinRecord.hasJoined) revert NotJoined();
            if (joinRecord.totalDuration < MIN_ATTENDANCE_SECONDS) revert DurationInsufficient();
            uint256 amount = rewardAmounts[i];
            YapToken(tokenAddress).mint(winner, amount);
            emit RewardsPaid(msg.sender, roomId, winner, amount, joinRecord.totalDuration);
        }

        emit RoomEnded(msg.sender, roomId, currentTime);
        delete _roomParticipants[msg.sender][roomId];
    }

    function getProfile(address user)
        external
        view
        returns (
            address wallet,
            string memory email,
            string memory name,
            uint64 createdRooms,
            uint64 joinedRooms,
            uint64 nextRoomId,
            uint64 lastActiveAt,
            address token,
            bool exists
        )
    {
        UserProfile storage profile = _profiles[user];
        return (
            profile.wallet,
            profile.email,
            profile.name,
            profile.createdRooms,
            profile.joinedRooms,
            profile.nextRoomId,
            profile.lastActiveAt,
            profile.token,
            profile.exists
        );
    }

    function getCreatorToken(address creator) external view returns (address) {
        UserProfile storage profile = _profiles[creator];
        if (!profile.exists) revert ProfileNotFound();
        return profile.token;
    }

    function getRoom(address creator, uint64 roomId) external view returns (Room memory room) {
        room = _rooms[creator][roomId];
        if (!room.exists) revert RoomNotFound();
    }

    function getRoomParticipants(address creator, uint64 roomId) external view returns (address[] memory) {
        Room storage room = _rooms[creator][roomId];
        if (!room.exists) revert RoomNotFound();
        return _roomParticipants[creator][roomId];
    }

    function getJoinDetails(address creator, uint64 roomId, address listener)
        external
        view
        returns (
            uint64 totalDuration,
            bool isActive,
            uint64 lastJoinedAt,
            bool hasJoined
        )
    {
        JoinState storage join = _joinState[creator][roomId][listener];
        return (join.totalDuration, join.isActive, join.lastJoinedAt, join.hasJoined);
    }

    function _now() private view returns (uint64) {
        return uint64(block.timestamp);
    }
}
