'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function CustomCalendar({
  selectedDate,
  onDateSelect,
  apartmentId,
  excludeBookingId = null,
  placeholder = "Select date",
  minDate = null,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (apartmentId && isOpen) {
      fetchUnavailableDates();
    }
  }, [apartmentId, isOpen, excludeBookingId]);

  const fetchUnavailableDates = async () => {
    try {
      setLoading(true);
      const url = `/api/apartments/${apartmentId}/unavailable-dates${
        excludeBookingId ? `?excludeBooking=${excludeBookingId}` : ''
      }`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setUnavailableDates(data.data.dates);
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateUnavailable = (date) => {
    if (!date) return false;
    const dateString = date.toISOString().split('T')[0];
    return unavailableDates.includes(dateString);
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable if minimum date is set and date is before it
    if (minDate && date < minDate) return true;
    
    // Disable if date is unavailable
    if (isDateUnavailable(date)) return true;
    
    return false;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    onDateSelect(date);
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const formatDisplayDate = (date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white flex items-center justify-between hover:border-gray-400"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayDate(selectedDate)}
        </span>
        <Calendar className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading availability...
            </div>
          )}

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-8" />;
                }

                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                const isDisabled = isDateDisabled(date);
                const isUnavailable = isDateUnavailable(date);
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateClick(date)}
                    disabled={isDisabled}
                    className={`h-8 text-sm rounded transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : isUnavailable
                        ? 'bg-red-100 text-red-400 cursor-not-allowed'
                        : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-purple-100 text-gray-700'
                    }`}
                    title={isUnavailable ? 'Unavailable' : isDisabled ? 'Disabled' : ''}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-600 rounded mr-2"></div>
                  <span>Selected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
