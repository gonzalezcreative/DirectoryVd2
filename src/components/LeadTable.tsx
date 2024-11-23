{/* Update the getPurchaseButton function */}
const getPurchaseButton = (lead: Lead) => {
  const purchasedBy = lead.purchasedBy || [];
  
  if (!user) {
    return (
      <button
        onClick={() => handlePurchaseClick(lead.id)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <User className="h-4 w-4 mr-2" />
        Unlock Details (${LEAD_PRICE / 100})
      </button>
    );
  }

  if (purchasedBy.includes(user.id)) {
    return (
      <span className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-100">
        <Check className="h-4 w-4 mr-2" />
        Purchased
      </span>
    );
  }

  if (purchasedBy.length >= 3) {
    return (
      <span className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-100">
        <Users className="h-4 w-4 mr-2" />
        No Longer Available
      </span>
    );
  }

  return (
    <button
      onClick={() => handlePurchaseClick(lead.id)}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <User className="h-4 w-4 mr-2" />
      Unlock Details (${LEAD_PRICE / 100})
      <span className="ml-2 text-xs bg-blue-500 px-2 py-0.5 rounded-full">
        {3 - purchasedBy.length} left
      </span>
    </button>
  );
};