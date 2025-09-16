export function checkApartmentAvailability(apartment, tenants) {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Ensure apartment has a valid ID
  const apartmentId = apartment._id?.toString() || apartment.id?.toString();
  if (!apartmentId) return 'Available';
  
  // Find if any tenant is currently occupying this apartment
  const isCurrentlyBooked = tenants.some(tenant => {
    // Check if tenant is assigned to this apartment
    const tenantApartmentId = tenant.apartment?.toString();
    if (!tenantApartmentId || tenantApartmentId !== apartmentId) return false;
    
    // Check if tenant has valid stay details
    if (!tenant.stayDetails?.checkInDate || !tenant.stayDetails?.checkOutDate) return false;
    
    const checkInDate = new Date(tenant.stayDetails.checkInDate);
    const checkOutDate = new Date(tenant.stayDetails.checkOutDate);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(23, 59, 59, 999);
    
    // Check if current date falls within the booking period
    return currentDate >= checkInDate && currentDate <= checkOutDate;
  });
  
  return isCurrentlyBooked ? 'Occupied' : 'Available';
}

export function updateApartmentAvailability(apartments, tenants) {
  return apartments.map(apartment => ({
    ...apartment,
    status: checkApartmentAvailability(apartment, tenants)
  }));
}
