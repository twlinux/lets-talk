#!/bin/bash

function help () {
  cat << EOF
usage: ./lets_talk.sh OR sudo PORt-80 ./lets_talk.sh

Wrapper script for launching the "Let's Talk!" application with docker-compose.
Probably cross-compatible with POSIX-compliant shells.

actions:
  -h      show this help message and exit
  -d      execute "docker compose down --volumes" before starting, which resets the MySQL database.
  -b      (re-)build images.
  -p      prune orphaned docker stuff.
  -n      don't start the server.

optional arguments:
  -m      start server with development configuration (mount server folders instead of copying).
  -t      mount /etc/localtime:ro in containers to correct timers. This is automatically set for Linux servers.
  -w      prevent mounting of /etc/localtime.
  -i NIC  specify the network interface for private IPv4 address. (default: enp3s0)
          Examples: enp3s0, eth0, wlan1, wlp2s0
          Special case: if you are using docker-machine (which is employed by Docker Toolbox),
          use the keyword "machine" as the parameter. ./lets_talk.sh -i machine
EOF
}

[ "$1" = "--help" ] && help && exit 0

# default values
down=0
build=0
prune=0
skip=0
dev=0
timez=0
nic=enp3s0

# output colors
red=$(tput setaf 1)
dim=$(tput dim)
reset=$(tput sgr0)
bold=$(tput bold)
underline=$(tput smul)

while getopts ":hdbpnmtwi:" opt; do
  case $opt in
  h   ) help && exit 0           ;;
  d   ) down=1                   ;;
  b   ) build=1                  ;;
  p   ) prune=1                  ;;
  n   ) skip=1                   ;;

  m   ) dev=1                    ;;
  t   ) timez=1                  ;;
  w   ) timez=no                 ;;
  i   ) nic=${OPTARG,,}          ;;
  \?  ) help && echo "${red}Invalid option: ${bold}-$OPTARG${reset}" >&2
    exit 1 ;;
  :   ) help && echo "${red}Option ${bold}-$OPTARG${reset}${red} requires an argument.${reset}" >&2 
    exit 1 ;;
  esac
done

printf "\n\t%s\n\n" "$(tput setaf 2)Let's Talk! $(tput setaf 6)└( ^o^)$(tput setaf 4)Ｘ$(tput setaf 5)(^◡^ )ノ$reset"

# system information ==================
private_ip=none
personal=localhost
is_systemd=0

# check if system uses systemd
which systemctl 1> /dev/null 2> /dev/null && systemctl > /dev/null && is_systemd=1
uname=$(uname)
info="${dim}Server info autodetection:${reset} $uname"
warn="$(tput setaf 3)WARNING${reset}:"
if [ "$is_systemd" -eq "1" ]; then
  info="$info (systemd)"
elif [[ ${uname^^} = *"MINGW"* ]]; then # try to detect Docker Quickstart Terminal
  has_machine=0 && which docker-machine 1> /dev/null 2> /dev/null && has_machine=1;
  if [ "$has_machine" = "1" ]; then 
    info="$info (Docker Quickstart terminal on Windows)"
    nic=machine
  fi
  unset has_machine
fi

if [[ ${uname^^} = *"LINUX"* ]]; then
  [ "$timez" != "no" ] && timez=1
fi
[ "$timez" = "no" ] && timez=0

info="$info$reset"
echo $info 1>&2

# IP addresses & URLs ===========================

if [ "$nic" = "machine" ]; then
  personal=$(docker-machine ip)
  [ "$?" -ne 0 ] && personal=1
elif which ip 1> /dev/null 2> /dev/null ; then # maybe UNIX?
  private_ip=$(ip addr show $nic | awk '/inet / {sub(/\/.*/, "", $2); print $2}')
fi

function running () {
  [ "$is_systemd" -eq "0" ] && return 2 # current machine does not use systemd
  systemctl is-active --quiet $1        # checks if the service is running
  # always returns 0 if service is active
  # returns 3 if machine usus systemd but the service is dead
}

PORT=${PORT:-8080}

if [[ $PORT = 80 ]]; then
  disp_port=""
else
  disp_port=":$PORT"
fi

strf="%-30s%s\n"
prefix='http://'

[ "$personal" != "1" ] && \
printf $strf "${dim}Local:${reset}" "${bold}${underline}${prefix}${personal}${disp_port}/${reset}"
running avahi-daemon && \
printf $strf "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local${disp_port}/${reset}"
[[ $private_ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && \
printf $strf "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}${disp_port}/${reset}"


# if machine uses systemd and docker is inactive, let's try to start it
running docker
if [ "$?" -eq "3" ]; then
  set -x
  systemctl start docker
  { set +x; } 2> /dev/null
fi

# do stuff ======================================

set -e # quit on failure

if [ "$down" = "1" ]; then
  set -x
  PORT=$PORT docker-compose down -v
  { set +x; } 2> /dev/null
fi

if [ "$prune" = "1" ]; then
  echo "I hope you know what you're doing..."
  echo "If you use docker for other projects besides Let's Talk, \"-p\" is a danerous flag to set."
  set -x
  [ "$down" = 0 ] && PORT=$PORT docker-compose down -v
  docker system prune
  docker volume prune
  { set +x; } 2> /dev/null
fi

if [ "$build" = "1" ]; then
  set -x
  PORT=$PORT docker-compose build
  { set +x; } 2> /dev/null
fi

if [ "$skip" = "1" ]; then
  echo 'The flag "-n" was specified. Exiting now...'
  exit
fi

if [ "$dev" = "1" ]; then
  PORT=$PORT docker-compose --file dev-compose.yml up --abort-on-container-exit
elif [ "$timez" = "1" ]; then
  PORT=$PORT docker-compose --file tz-compose.yml up --abort-on-container-exit
else
  PORT=$PORT docker-compose up --abort-on-container-exit # run normally
fi
