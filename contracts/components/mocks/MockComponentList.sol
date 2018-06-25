pragma solidity 0.4.24;


contract MockComponentList {

    struct component {
        mapping(string => address) versionToComponent;
    }
    
    mapping(string => component) categoryToComponents;

    function setComponent(string category, string version, address componentAddress) public payable {
        categoryToComponents[category].versionToComponent[version] = componentAddress;
    }

    function getComponent(string category, string version) public view returns (address){
        return categoryToComponents[category].versionToComponent[version];
    }

}