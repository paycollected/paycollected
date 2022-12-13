function updateActiveMembersInCache(members, newOwner) {
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

export function modifyQuantCacheUpdate(
  cache,
  { data: { editQuantity: { planId, quantity: resultQuant } } }
) {
  cache.modify({
    id: `PlanDetail:{"planId":"${planId}"}`,
    fields: {
      quantity() { return resultQuant; },
    }
  });
}

export function transferOwnershipCacheUpdate(
  cache,
  { data: { transferOwnership: { planId, newOwner } } }
) {
  cache.modify({
    id: `PlanDetail:{"planId":"${planId}"}`,
    fields: {
      isOwner() { return false; },
      activeMembers(members) { return updateActiveMembersInCache(members, newOwner); },
      owner() { return newOwner; },
    }
  });
}

export function modifyQuantTransferCacheUpdate(
  cache,
  { data: { transferOwnership: { newOwner }, editQuantity: { planId, quantity: resultQuant } } }
) {
  cache.modify({
    id: `PlanDetail:{"planId":"${planId}"}`,
    fields: {
      quantity() { return resultQuant; },
      isOwner() { return false; },
      owner() { return newOwner; },
      activeMembers(members) { return updateActiveMembersInCache(members, newOwner); },
    }
  });
}
