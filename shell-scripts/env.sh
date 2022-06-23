#!/usr/bin/env bash

ENV_LOCATION="${PWD}"

if [ "$NODE_ENV" == 'production' ]; then
  export UPDATE_ME=''  
else
  export UPDATE_ME=''
fi

echo $UPDATE_ME

emulator_env=(
  PUSHOVER_USER=''
  PUSHOVER_TOKEN=''
)

_config=(
  project
  pushover
  discord
  slack
)

_env=(
  pushover.user=''
  pushover.token=''
)

function print_development_env() {
  echo VARIABLE_UPDATE_ME=$UPDATE_ME  
}

function clear_env() {
  export UPDATE_ME=  
}

function _config_set() {
  for var in "${_env[@]}"; do
    echo "${var}"
  done
}

function _config_unset_all() {
  for var in "${firebase_config[@]}"; do
    echo "${var}"
  done
  echo
  echo "_env variables cleared"
  for var in "${emulator_env[@]}"; do
    export "$(echo "${var}" | sed 's/\=.*$//g')"
  done
  echo "config variables unset."
}

function emulator_config_set() {
  for var in "${emulator_env[@]}"; do
    export "${var?}"
  done    
}

function env_generator() {
  echo "Clearing existing .env" && echo "" >"${ENV_LOCATION}/.env"
  for var in "${emulator_env[@]}"; do
    echo "${var}" >>"${ENV_LOCATION}/.env"
  done
  echo "Wrote new ${ENV_LOCATION}/.env"
  echo
  cat "${ENV_LOCATION}/.env"
}

function display_emulator_firebase_config() {
  echo "🔥🔥🔥 Firebase Emulator settings:"
  echo
  for var in "${emulator_env[@]}"; do
    echo "${var}"
  done
  echo  
  echo
  echo "🔥🔥🔥 Config settings:"
  echo
  for var in "${firebase_env[@]}"; do
    echo "${var}"
  done
  echo
}

function usage() {
  echo
  echo " Usage: ./env.sh [option]"
  echo "  -e - 1. Set 🔥🔥🔥 Emulator environment variables"
  echo "  -f - 2. Set 🔥🔥🔥 Configuration variables"
  echo "  -s - 3. Show 🔥🔥🔥 Emulator & Configuration variables"
  echo "  -g - 4. Generate Node .env variables"
  echo "  -u - 8. Unset all Firebase Configuration variables"
  echo "  -m - Show Menu"
  echo "  -h - Usage/Help"
  echo
}

function show_menus() {
  clear
  echo
  echo "  1. Set 🔥🔥🔥 Emulator environment variables"
  echo "  2. Set 🔥🔥🔥 Configuration variables"
  echo "  3. Show 🔥🔥🔥 Emulator & Configuration variables"
  echo "  4. Generate Node .env variables"
  echo "  5. Generate and set Firebase all"
  echo "  8. Unset all 🔥🔥🔥 Configuration variables"
  echo "  0. Exit"
  echo
}

function read_options() {
  local choice
  read -p "Enter choice [ 1 2 3 0 ] => " choice
  case $choice in
  1) emulator_config_set ;;
  2) _config_set ;;
  3) display_emulator_config ;;
  4) env_generator ;;
  5)
    firebase_config_unset_all &&
      emulator_config_set &&
      _config_set &&
      display_emulator_config &&
      print_development_env
    ;;
  8) _config_unset_all ;;
  0) exit 0 ;;
  *) echo -e "${RED} Menu entry error...${STD}" && sleep 1 ;;
  esac
}

function do_menu() {
  while true; do
    show_menus
    read_options
  done
}

# [[ $# -eq 0 ]] && usage

if [[ "$*" ]]; then
  while getopts "efsgaumhx" opt; do
    case $opt in
    e)
      echo "🔥🔥🔥 Setting Emulator Environment Variables"
      emulator_config_set
      shift
      ;;
    f)
      echo "🔥🔥🔥 Setting Config Variables"
      _config_set
      shift
      ;;
    s)
      display_emulator_config
      echo "Whooohoooo 🎉🎉🎉"
      shift
      ;;
    g)
      echo "Generating localhost .env..."
      _development
      env_generator
      echo
      print_development_env
      shift
      ;;
    u)
      echo "🔥🔥🔥 config unset all"
      _config_unset_all
      shift
      ;;
    a)
      echo "🔥🔥🔥 Environment set and config all"
      _config_unset_all
      emulator_config_set
      _config_set
      display_emulator_config
      echo
      print_development_env
      echo "Whooohoooo 🎉🎉🎉"
      shift
      ;;
    x)
      export_file
      shift
      ;;
    m)
      do_menu
      shift
      ;;
    h)
      usage
      exit 0
      ;;
    \?) ;;
    esac
  done
else
  usage
  exit 0
fi

trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
trap 'echo "\"${last_command}\" command filed with exit code $?."' EXIT
