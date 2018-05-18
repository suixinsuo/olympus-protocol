pragma solidity ^0.4.23;

import "../permission/PermissionProviderInterface.sol";
import "./TokenizationIndexInterface.sol";

//白名单控制

// Fund Name
// 描述
// 分类
// tokens / percentage for index
// Rebalance 频率
// 购买频率（时间）
// 购买频率 （数量）
// 管理费率
// 管理费提现周期
// 业绩费率
// 业绩费提现周期
// deposit
// 设置底舱
// 风控合约接口（验证每笔交易操作，返回true）
// owner invest amount
// owner invest 锁定期
// fund owner
// Fund Status: Pause、Close、Active
// transferOwnership
// withdrawFee
// operator




contract TokenizationIndex is TokenizationIndexInterface  {
    
    //Permission Control
    PermissionProviderInterface internal permissionProvider;


    //modifier
    modifier onlyCore() {
        require(permissionProvider.has(msg.sender, permissionProvider.ROLE_CORE()));
        _;
    }

    //event



    //mapping



    //function 

    function TokenizationIndex(address _permissionProvider) public {
        permissionProvider = PermissionProviderInterface(_permissionProvider);
    }


}