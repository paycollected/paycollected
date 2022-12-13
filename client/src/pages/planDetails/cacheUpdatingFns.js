export default function updateActiveMembersInCache(members, newOwner) {
  const modifiedMembers = new Array(members.length);
  members.forEach((member, i) => {
    if (member.username !== newOwner.username) modifiedMembers[i] = member;
    else {
      const newOwnerObj = member;
      const copyOfNewOwnerObj = {};
      Object.keys(newOwnerObj).forEach((prop) => {
        if (prop !== 'isOwner') copyOfNewOwnerObj[prop] = newOwnerObj[prop];
        else copyOfNewOwnerObj[prop] = true;
      });
      modifiedMembers[i] = copyOfNewOwnerObj;
    }
  });
  return modifiedMembers;
}
