#!/bin/bash -e

function help () {
  cat << EOF
usage: ./url_start.sh [-h] [-c] [-i NIC]

Wrapper script for launching the "Let's Talk!" application with docker-compose.
Probably cross-compatible with POSIX-compliant shells.

optional arguments:
  -h      show this help message and exit
  -c      delete the MySQL database before starting, a new one will be created.
  -i NIC  specify the network interface for private IP address (default: enp3s0)
EOF
}

# default values
clean=0;
nic=enp3s0

while getopts ":hci:" opt; do
  case $opt in
  h  ) help                                             && exit 0 ;;
  c  ) clean=1                                                    ;;
  i  ) nic=$OPTARG                                                ;;
  \? ) echo "Invalid option: -$OPTARG" >&2              && exit 1 ;;
  :  ) echo "Option -$OPTARG requires an argument." >&2 && exit 1 ;;
  esac
done

printf "\t%s\n\n" "$(tput setaf 2)Let's Talk! $(tput setaf 6)└( ^o^)$(tput setaf 4)Ｘ$(tput setaf 5)(^◡^ )ノ$(tput sgr0)"

# check if system uses systemd
is_systemd=0
which systemctl > /dev/null && systemctl > /dev/null && is_systemd=1
function running () {
  [ "$is_systemd" -eq "0" ] && return 2 # current machine does not use systemd
  systemctl is-active --quiet $1        # checks if the service is running
  # always returns 0 if service is active
  # returns 3 if machine usus systemd but the service is dead
}

# host mount point for MySQL data
db=database/sql
mkdir -p $db

if [ "$clean" = "1" ]; then
  set -x
  sudo rm -r $db
  mkdir $db
  set +x
fi

NODE_PORT=${PORT:-8080}
[[ $NODE_PORT = 80 ]] && disp_port="" || disp_port=":$NODE_PORT"

private_ip=$(ip addr show $nic | awk '/inet / {sub(/\/.*/, "", $2); print $2}')

dim=$(tput dim)
reset=$(tput sgr0)
bold=$(tput bold)
underline=$(tput smul)

strf="%-30s%s\n"
prefix='http://'

printf $strf "${dim}Local:${reset}" "${bold}${underline}${prefix}localhost${disp_port}/${reset}"
running avahi-daemon && \
printf $strf "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local${disp_port}/${reset}"
[[ $private_ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && \
printf $strf "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}${disp_port}/${reset}"


# if machine uses systemd and docker is inactive, let's try to start it
set +e
running docker
if [ "$?" -eq "3" ]; then
  set -x
  systemctl start docker
  set +x
fi

PORT=$NODE_PORT docker-compose up
