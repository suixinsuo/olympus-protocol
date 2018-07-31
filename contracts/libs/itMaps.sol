pragma solidity ^0.4.20;

library itMaps {

    struct entryBytes32Uint {
        // Equal to the index of the key of this item in keys, plus 1.
        uint keyIndex;
        uint value;
    }

    struct itMapBytes32Uint {
        mapping(bytes32 => entryBytes32Uint) data;
        bytes32[] keys;
    }

    function insert(itMapBytes32Uint storage self, bytes32 key, uint value) internal returns (bool replaced) {
        entryBytes32Uint storage e = self.data[key];
        e.value = value;
        if (e.keyIndex > 0) {
            return true;
        } else {
            e.keyIndex = ++self.keys.length;
            self.keys[e.keyIndex - 1] = key;
            return false;
        }
    }

    function remove(itMapBytes32Uint storage self, bytes32 key) internal returns (bool success) {
        entryBytes32Uint storage e = self.data[key];
        if (e.keyIndex == 0)
            return false;

        if (e.keyIndex <= self.keys.length) {
            // Move an existing element into the vacated key slot.
            self.data[self.keys[self.keys.length - 1]].keyIndex = e.keyIndex;
            self.keys[e.keyIndex - 1] = self.keys[self.keys.length - 1];
            self.keys.length -= 1;
            delete self.data[key];
            return true;
        }
    }

    function destroy(itMapBytes32Uint storage self) internal  {
        for (uint i; i<self.keys.length; i++) {
            delete self.data[self.keys[i]];
        }
        delete self.keys;
        return ;
    }

    function contains(itMapBytes32Uint storage self, bytes32 key) internal constant returns (bool exists) {
        return self.data[key].keyIndex > 0;
    }

    function size(itMapBytes32Uint storage self) internal constant returns (uint) {
        return self.keys.length;
    }

    function get(itMapBytes32Uint storage self, bytes32 key) internal constant returns (uint) {
        return self.data[key].value;
    }

    function getKey(itMapBytes32Uint storage self, uint idx) internal constant returns (bytes32) {
      /* Decrepated, use getKeyByIndex. This kept for backward compatilibity */
        return self.keys[idx];
    }

    function getKeyByIndex(itMapBytes32Uint storage self, uint idx) internal constant returns (bytes32) {
      /* Same as decrepated getKey. getKeyByIndex was introduced to be less ambiguous  */
        return self.keys[idx];
    }

    function getValueByIndex(itMapBytes32Uint storage self, uint idx) internal constant returns (uint) {
        return self.data[self.keys[idx]].value;
    }
}