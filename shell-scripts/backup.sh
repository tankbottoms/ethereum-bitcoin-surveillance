#!/usr/bin/env bash

set -e
export GOOGLE_APPLICATION_CREDENTIALS=
export BACKUP_SESSION="backup.$(date +%Y%m%d-%H%M)"
export BACKUP_PATH

function check_google_app_credentials() {
    if [ "$GOOGLE_APPLICATION_CREDENTIALS" -e "" ]; then
        echo "SET THE GOOGLE_APPLICATION_CREDENTIALS"
        exit 1
    fi
}

function set_backup_location() {
    if [ "$#" -ne 1 ]; then
        echo "🤮 $0 -s requires directory" >&2
        exit 1
    fi
    if [ -e "$1" ]; then
        echo "🤮 $1 not found" >&2
        exit 1
    fi
    if ! [ -d "$1" ]; then
        echo "🤮 $1 not a directory" >&2
        exit 1
    fi
    export BACKUP_PATH="$1"
    echo "💩 Backup directory set to ${BACKUP_PATH}"
    echo "legend: 💾💩 - data dump"
}

function export_from_UPDATE_ME() {
    if ! [ -d "${BACKUP_PATH}" ]; then
        echo "Use $0 -s to set local backup location"
    fi
    echo 💾 online collections..."${UPDATE_ME_BACKUP_STORAGE_LOCATION}"
    echo "👇 firebase local path...${BACKUP_PATH}"
    # echo gsutil -m cp -r "$UPDATE_ME/backup.$(date +%Y%m%d-%H%M)" "${BACKUP_PATH}/${BACKUP_SESSION}"
}

function import_into_emulator() {
    echo attempting to import back up 👆 
    sudo lsof -i:8080 && echo 🤮 emulator not running
    return || echo "attempting emulator upload"
    # echo firebase emulators:start --import="$BACKUP_PATH/${BACKUP_SESSION}"
}

function usage() {
    echo
    echo " Usage: ./backup.sh [option]"
    echo "  -e - 1. Export from 🔥🔥🔥 console"
    echo "  -r - 2. Import into 🔥🔥🔥 emulator"
    echo "  -s - 3. Set 💾💾💾 Backup Directory"
    echo "  -m -    Show Menu"
    echo "  -h -    Usage/Help"
    echo "       0. Exit"
    echo
}

function read_options() {
    local choice
    read -p "Enter choice [ 1 2 ... 0 ] => " choice
    case $choice in
    1) export_from ;;
    2) import_into ;;
    3) set_backup_location ;;
    0) exit 0 ;;
    *) echo -e "${RED} 🤮 🤮 🤮 Menu entry error...${STD}" && sleep 1 ;;
    esac
}

function do_menu() {
    while true; do
        usage
        read_options
    done
}

# [[ $# -eq 0 ]] && usage

if [[ "$*" ]]; then
    while getopts "ermh" opt; do
        case $opt in
        e)
            echo "🔥🔥🔥 Export Collisions from Online Console"
            export_from_firebase
            shift
            ;;
        r)
            echo "🔥🔥🔥 Importing into Firebase Emulator"
            firebase_config_set
            shift
            ;;
        s)
            echo "🔥🔥🔥 Set Backup Location"
            set_backup_location
            shift
            ;;
        s)
            echo
            echo "Whooohoooo 🎉🎉🎉"
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
