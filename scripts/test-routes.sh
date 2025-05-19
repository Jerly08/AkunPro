#!/bin/bash

# Script untuk menguji routing pada aplikasi
echo "Testing routes for AkunPro application"

# Domain yang akan diuji
DOMAIN="https://myakunpro.com"

# Fungsi untuk menguji route
test_route() {
  local route=$1
  local expected_status=$2
  
  echo -n "Testing $DOMAIN$route... "
  status=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN$route)
  
  if [ "$status" -eq "$expected_status" ]; then
    echo "OK ($status)"
  else
    echo "FAILED (Got: $status, Expected: $expected_status)"
  fi
}

# Uji rute utama dan redirect
test_route "/" 200
test_route "/home" 200

echo "Route testing completed" 